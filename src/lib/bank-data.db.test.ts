import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";

// Savollar banki (FEATURES.md, B qism): bazadagi ma'lumot bilan

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));

vi.mock("@/lib/auth/guards", () => {
  const requireUser = async () => {
    if (!session.user) throw new Error("REDIRECT /login");
    return session.user;
  };
  const requireRole = async (roles: readonly string[]) => {
    const user = await requireUser();
    if (!roles.includes(user.role)) throw new Error("REDIRECT home");
    return user;
  };
  return {
    getSession: async () => null,
    getCurrentUser: async () => session.user,
    requireUser,
    requireRole,
    requireAdmin: () => requireRole(["ADMIN"]),
    requireTeacher: () => requireRole(["TEACHER"]),
    requireManager: () => requireRole(["MANAGER"]),
    requireStaff: () => requireRole(["TEACHER", "MANAGER"]),
    requireStudent: () => requireRole(["STUDENT"]),
  };
});

const {
  bankQuestionStats,
  copyBankToTest,
  importToBank,
  pickFromBank,
  saveTestToBank,
} = await import("./bank-data");
const actions = await import("@/app/(teacher)/teacher/bank/actions");
const { FORBIDDEN } = await import("@/lib/auth/scope");

let alibek: CurrentUser;
let bobur: CurrentUser;
let css: string;
let flex: string;
let js: string;
let groupId: string;

async function teacher(username: string): Promise<CurrentUser> {
  const u = await db.user.create({
    data: { username, fullName: username, passwordHash: "x", role: "TEACHER" },
  });
  return { ...u, groupId: null, regionId: null };
}

async function topic(ownerId: string, name: string, parentId?: string) {
  return (
    await db.topic.create({
      data: { ownerId, name, parentId: parentId ?? null },
    })
  ).id;
}

async function bankQuestion(
  topicId: string,
  text: string,
  difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM",
  ownerId = alibek.id,
) {
  return (
    await db.bankQuestion.create({
      data: {
        ownerId,
        topicId,
        text,
        difficulty,
        options: {
          create: [
            { text: "Ha", isCorrect: true, order: 0 },
            { text: "Yo'q", isCorrect: false, order: 1 },
          ],
        },
      },
    })
  ).id;
}

async function test(title: string, groupIds: string[] = []) {
  return (
    await db.test.create({
      data: {
        title,
        durationMin: 10,
        createdById: alibek.id,
        ownerId: alibek.id,
        groups: { connect: groupIds.map((id) => ({ id })) },
      },
    })
  ).id;
}

const editInput = (topicId: string, text: string) => ({
  text,
  type: "SINGLE" as const,
  points: 2,
  topicId,
  difficulty: "HARD" as const,
  explanation: null,
  tags: [],
  options: [
    { text: "Birinchi", isCorrect: false },
    { text: "Ikkinchi", isCorrect: true },
  ],
});

beforeEach(async () => {
  await resetDatabase();
  alibek = await teacher("alibek");
  bobur = await teacher("bobur");
  session.user = alibek;
  css = await topic(alibek.id, "CSS");
  flex = await topic(alibek.id, "Flexbox", css);
  js = await topic(alibek.id, "JS");
  groupId = (
    await db.group.create({ data: { name: "Frontend", teacherId: alibek.id } })
  ).id;
});

describe("bankdan testga nusxa", () => {
  it("bankdagi savol tahrirlansa, test savoli o'zgarmaydi", async () => {
    const bq = await bankQuestion(flex, "justify-content nima qiladi?");
    const t = await test("Flex testi");
    expect(await copyBankToTest(alibek.id, t, [bq])).toBe(1);

    const result = await actions.updateBankQuestion(
      bq,
      editInput(flex, "Yangi matn"),
    );
    expect(result.ok).toBe(true);

    const copy = await db.question.findFirstOrThrow({
      where: { testId: t },
      include: { options: { orderBy: { order: "asc" } } },
    });
    expect(copy).toMatchObject({
      text: "justify-content nima qiladi?",
      points: 1,
      sourceBankQuestionId: bq,
    });
    expect(copy.options.map((o) => [o.text, o.isCorrect])).toEqual([
      ["Ha", true],
      ["Yo'q", false],
    ]);
  });

  it("boshqa o'qituvchining yoki arxivdagi savoli — FORBIDDEN", async () => {
    const foreign = await bankQuestion(
      await topic(bobur.id, "Boburniki"),
      "Begona",
      "EASY",
      bobur.id,
    );
    const archived = await bankQuestion(css, "Eski");
    await db.bankQuestion.update({
      where: { id: archived },
      data: { archivedAt: new Date() },
    });
    const t = await test("Test");
    expect(await copyBankToTest(alibek.id, t, [foreign])).toBe("FORBIDDEN");
    expect(await copyBankToTest(alibek.id, t, [archived])).toBe("FORBIDDEN");
    expect(await db.question.count()).toBe(0);
  });
});

describe("avtomatik yig'ish", () => {
  it("mavzu (ichkilari bilan) va qiyinlik bo'yicha, yetmasa — nechtasi kam", async () => {
    await bankQuestion(css, "css-1", "MEDIUM");
    await bankQuestion(flex, "flex-1", "MEDIUM");
    await bankQuestion(flex, "flex-2", "EASY");
    await bankQuestion(js, "js-1", "MEDIUM");
    const t = await test("Test");

    const result = await pickFromBank(alibek.id, t, {
      rules: [
        { topicId: css, difficulty: "MEDIUM", count: 3 },
        { topicId: flex, difficulty: null, count: 5 },
      ],
      excludeUsed: false,
    });
    if (result === "FORBIDDEN") throw new Error("FORBIDDEN");
    expect(result.picked[0].map((p) => p.text).sort()).toEqual([
      "css-1",
      "flex-1",
    ]);
    // Birinchi qoidaga tushgan savol ikkinchisiga tushmaydi
    expect(result.picked[1].map((p) => p.text)).toEqual(["flex-2"]);
    expect(result.shortages).toEqual([
      { rule: 0, missing: 1 },
      { rule: 1, missing: 4 },
    ]);
  });

  it("shu testdagi va (tanlansa) shu guruhning boshqa testlaridagi savollar olinmaydi", async () => {
    const used = await bankQuestion(js, "Guruhda ishlatilgan");
    const inTest = await bankQuestion(js, "Testda bor");
    await bankQuestion(js, "Yangi");
    const old = await test("Eski test", [groupId]);
    await copyBankToTest(alibek.id, old, [used]);
    const t = await test("Yangi test", [groupId]);
    await copyBankToTest(alibek.id, t, [inTest]);

    const texts = async (excludeUsed: boolean) => {
      const r = await pickFromBank(alibek.id, t, {
        rules: [{ topicId: js, difficulty: null, count: 10 }],
        excludeUsed,
      });
      if (r === "FORBIDDEN") throw new Error("FORBIDDEN");
      return r.picked[0].map((p) => p.text).sort();
    };
    expect(await texts(false)).toEqual(["Guruhda ishlatilgan", "Yangi"]);
    expect(await texts(true)).toEqual(["Yangi"]);
  });

  it("boshqa o'qituvchining mavzusi — FORBIDDEN", async () => {
    const foreign = await topic(bobur.id, "Begona");
    const t = await test("Test");
    expect(
      await pickFromBank(alibek.id, t, {
        rules: [{ topicId: foreign, difficulty: null, count: 1 }],
        excludeUsed: false,
      }),
    ).toBe("FORBIDDEN");
  });
});

describe("takroriy savollar", () => {
  it("testdan bankka ikki marta saqlansa, ikkinchisida qo'shilmaydi", async () => {
    const t = await test("Test");
    for (const [order, text] of ["Birinchi", "Ikkinchi"].entries())
      await db.question.create({
        data: {
          testId: t,
          text,
          order,
          options: {
            create: [
              { text: "A", isCorrect: true, order: 0 },
              { text: "B", isCorrect: false, order: 1 },
            ],
          },
        },
      });
    const target = { topicId: js, difficulty: "EASY" as const };
    expect(await saveTestToBank(alibek.id, t, target)).toEqual({
      added: 2,
      skipped: 0,
    });
    expect(await saveTestToBank(alibek.id, t, target)).toEqual({
      added: 0,
      skipped: 2,
    });
  });

  it("import: fayl ichidagi takror o'tkaziladi, yangi mavzu nomi bilan yaratiladi", async () => {
    const q = (text: string) => ({
      text,
      type: "SINGLE" as const,
      points: 1,
      options: [
        { text: "A", isCorrect: true },
        { text: "B", isCorrect: false },
      ],
    });
    const result = await importToBank(
      alibek.id,
      [
        { question: q("Grid nima?"), topic: "CSS Grid", difficulty: "HARD" },
        { question: q("grid  NIMA?"), topic: "", difficulty: null },
        { question: q("Flex nima?"), topic: "css / flexbox", difficulty: null },
      ],
      { topicId: js, difficulty: "EASY" },
    );
    expect(result).toEqual({ added: 2, skipped: 1 });
    const rows = await db.bankQuestion.findMany({
      orderBy: { text: "asc" },
      select: { text: true, difficulty: true, topic: { select: { name: true } } },
    });
    expect(rows).toEqual([
      { text: "Flex nima?", difficulty: "EASY", topic: { name: "Flexbox" } },
      { text: "Grid nima?", difficulty: "HARD", topic: { name: "CSS Grid" } },
    ]);
  });
});

describe("huquqlar", () => {
  it("boshqa o'qituvchining savoli va mavzusiga id bilan — FORBIDDEN", async () => {
    const own = await bankQuestion(css, "Meniki");
    session.user = bobur;
    expect(await actions.updateBankQuestion(own, editInput(css, "x"))).toEqual(
      FORBIDDEN,
    );
    expect(await actions.setBankQuestionArchived(own, true)).toEqual(
      FORBIDDEN,
    );
    expect(await actions.duplicateBankQuestion(own)).toEqual(FORBIDDEN);
    expect(await actions.deleteTopic(js)).toEqual(FORBIDDEN);
    expect(await actions.createTopic({ name: "Ichki", parentId: css })).toEqual(
      FORBIDDEN,
    );
    expect(
      await actions.createBankQuestionAction(editInput(css, "Yangi")),
    ).toEqual(FORBIDDEN);

    const boburTest = (
      await db.test.create({
        data: {
          title: "Bobur testi",
          durationMin: 5,
          createdById: bobur.id,
          ownerId: bobur.id,
        },
      })
    ).id;
    expect(await actions.addBankQuestionsToTest(boburTest, [own])).toEqual(
      FORBIDDEN,
    );
    expect(await db.question.count()).toBe(0);
    expect(
      await db.bankQuestion.findUniqueOrThrow({ where: { id: own } }),
    ).toMatchObject({ text: "Meniki", archivedAt: null });
  });

  it("bo'sh bo'lmagan mavzu o'chirilmaydi", async () => {
    await bankQuestion(flex, "Savol");
    expect((await actions.deleteTopic(css)).ok).toBe(false);
    expect((await actions.deleteTopic(flex)).ok).toBe(false);
    expect((await actions.deleteTopic(js)).ok).toBe(true);
  });
});

describe("statistika", () => {
  it("yakunlangan urinishlar bo'yicha, davom etayotgani hisoblanmaydi", async () => {
    const bq = await bankQuestion(js, "Savol");
    const t = await test("Test");
    await copyBankToTest(alibek.id, t, [bq]);
    const question = await db.question.findFirstOrThrow({ where: { testId: t } });
    const answer = async (
      i: number,
      isCorrect: boolean,
      status: "FINISHED" | "IN_PROGRESS" = "FINISHED",
    ) => {
      const student = await db.user.create({
        data: { username: `s${i}`, fullName: `S${i}`, passwordHash: "x" },
      });
      await db.attempt.create({
        data: {
          userId: student.id,
          testId: t,
          isFirst: true,
          status,
          deadlineAt: new Date(),
          answers: {
            create: {
              questionId: question.id,
              selectedOptionIds: [],
              isCorrect,
            },
          },
        },
      });
    };
    for (let i = 0; i < 10; i++) await answer(i, i < 7);
    await answer(99, false, "IN_PROGRESS");
    expect((await bankQuestionStats([bq])).get(bq)).toEqual({
      id: bq,
      attempts: 10,
      correct: 7,
    });
  });
});
