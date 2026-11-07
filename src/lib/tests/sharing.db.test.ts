import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import {
  addTestShares,
  copySharedTest,
  getSharedTests,
  getRegionShareTeachers,
  getShareTargets,
  searchShareTeachers,
  setTestShares,
} from "./sharing";

// Test ulashish: egasi ulashadi, oluvchi nusxa oladi; nusxa asl testga bog'liq emas

let alibek: string;
let bobur: string;
let saida: string; // boshqa regionda
let north: string;
let south: string;
let testId: string;

async function teacher(username: string, regionId: string) {
  return (
    await db.user.create({
      data: {
        username,
        fullName: username,
        passwordHash: "x",
        role: "TEACHER",
        teacherRegions: { create: { regionId } },
      },
    })
  ).id;
}

beforeEach(async () => {
  await resetDatabase();
  north = (await db.region.create({ data: { name: "Shimol" } })).id;
  south = (await db.region.create({ data: { name: "Janub" } })).id;
  alibek = await teacher("alibek", north);
  bobur = await teacher("bobur", north);
  saida = await teacher("saida", south);
  testId = (
    await db.test.create({
      data: {
        title: "CSS",
        durationMin: 10,
        createdById: alibek,
        ownerId: alibek,
        questions: {
          create: {
            text: "Flex?",
            order: 0,
            options: {
              create: [
                { text: "Ha", isCorrect: true, order: 0 },
                { text: "Yo'q", isCorrect: false, order: 1 },
              ],
            },
          },
        },
      },
    })
  ).id;
});

describe("ulashish", () => {
  it("faqat egasi; butun region — o'ziniki, o'qituvchi — istalgan regiondan", async () => {
    const share = (owner: string, regionIds: string[], teacherIds: string[]) =>
      setTestShares(owner, testId, { regionIds, teacherIds });
    expect(await share(bobur, [], [alibek])).toEqual({ ok: false });
    expect(await share(alibek, [south], [])).toEqual({ ok: false });
    expect(await share(alibek, [], ["missing"])).toEqual({ ok: false });
    await db.user.update({ where: { id: saida }, data: { isActive: false } });
    expect(await share(alibek, [], [saida])).toEqual({ ok: false });
    await db.user.update({ where: { id: saida }, data: { isActive: true } });
    expect(await share(alibek, [north], [saida])).toEqual({
      ok: true,
      count: 2,
    });
    expect((await getSharedTests(saida)).map((t) => t.title)).toEqual(["CSS"]);
  });

  it("tanlov: hamma regionlar (o'zinikilari birinchi) va o'qituvchilar soni", async () => {
    const targets = await getShareTargets(alibek);
    expect(targets.regions.map((r) => [r.name, r.own, r.teacherCount])).toEqual(
      [
        ["Shimol", true, 1],
        ["Janub", false, 1],
      ],
    );
    expect(targets.unassignedCount).toBe(0);
    expect(await getRegionShareTeachers(alibek, north)).toEqual([
      { id: bobur, name: "bobur" },
    ]);
    expect(await getRegionShareTeachers(alibek, null)).toEqual([]);
  });

  it("qidiruv: hamma regionlardan, o'zisiz, regionlari bilan", async () => {
    expect(await searchShareTeachers(alibek, "AID")).toEqual({
      teachers: [{ id: saida, name: "saida", regions: "Janub" }],
      more: false,
    });
    expect((await searchShareTeachers(alibek, "alib")).teachers).toEqual([]);
  });

  it("ulashilmagan test ko'rinmaydi va nusxa olinmaydi", async () => {
    expect(await getSharedTests(bobur)).toEqual([]);
    expect(await copySharedTest(bobur, testId)).toBeNull();
  });

  it("region bo'yicha ulashilsa — o'sha regiondagilar ko'radi, boshqalar — yo'q", async () => {
    await setTestShares(alibek, testId, { regionIds: [north], teacherIds: [] });
    expect((await getSharedTests(bobur)).map((t) => t.title)).toEqual(["CSS"]);
    expect(await getSharedTests(saida)).toEqual([]);
    // Egasi o'z testini "ulashilgan"da ko'rmaydi
    expect(await getSharedTests(alibek)).toEqual([]);
  });

  it("nusxa — oluvchiniki, nofaol, savollari bilan; asl test o'zgarsa nusxa o'zgarmaydi", async () => {
    await setTestShares(alibek, testId, { regionIds: [], teacherIds: [bobur] });
    const copyId = await copySharedTest(bobur, testId);
    expect(copyId).not.toBeNull();
    const copy = await db.test.findUniqueOrThrow({
      where: { id: copyId! },
      include: { questions: { include: { options: true } }, groups: true },
    });
    expect(copy).toMatchObject({
      ownerId: bobur,
      createdById: bobur,
      copiedFromId: testId,
      isActive: false,
    });
    expect(copy.groups).toEqual([]);
    expect(copy.questions[0].options).toHaveLength(2);

    await db.question.updateMany({
      where: { testId },
      data: { text: "O'zgardi" },
    });
    const after = await db.question.findFirstOrThrow({
      where: { testId: copyId! },
    });
    expect(after.text).toBe("Flex?");
  });

  it("menejer yaratgan test — u ishlaydigan o'qituvchilarga ko'rinadi", async () => {
    const manager = await db.user.create({
      data: {
        username: "m",
        fullName: "Menejer",
        passwordHash: "x",
        role: "MANAGER",
        teachers: { create: { teacherId: bobur } },
      },
    });
    await db.test.create({
      data: { title: "Menejer testi", durationMin: 5, createdById: manager.id },
    });
    expect((await getSharedTests(bobur)).map((t) => t.title)).toEqual([
      "Menejer testi",
    ]);
    expect(await getSharedTests(alibek)).toEqual([]);
  });
});

describe("bir yo'la ulashish", () => {
  async function ownTest(title: string, owner: string) {
    return (
      await db.test.create({
        data: { title, durationMin: 5, createdById: owner, ownerId: owner },
      })
    ).id;
  }

  it("hamma tanlangan testlar ulashiladi, avvalgi ulashish saqlanadi", async () => {
    const second = await ownTest("HTML", alibek);
    await setTestShares(alibek, testId, { regionIds: [north], teacherIds: [] });
    expect(
      await addTestShares(alibek, [testId, second], {
        regionIds: [],
        teacherIds: [bobur],
      }),
    ).toEqual({ ok: true, tests: 2 });
    expect(await db.testShare.count({ where: { testId } })).toBe(2);
    expect((await getSharedTests(bobur)).map((t) => t.title).sort()).toEqual([
      "CSS",
      "HTML",
    ]);
  });

  it("qayta ulashilsa takrorlanmaydi", async () => {
    const input = { regionIds: [north], teacherIds: [] };
    await addTestShares(alibek, [testId], input);
    await addTestShares(alibek, [testId], input);
    expect(await db.testShare.count({ where: { testId } })).toBe(1);
  });

  it("begona test yoki begona region bo'lsa — hech narsa o'zgarmaydi", async () => {
    const foreign = await ownTest("Begona", bobur);
    const target = { regionIds: [north], teacherIds: [] };
    expect(await addTestShares(alibek, [testId, foreign], target)).toEqual({
      ok: false,
    });
    expect(
      await addTestShares(alibek, [testId], {
        regionIds: [south],
        teacherIds: [],
      }),
    ).toEqual({ ok: false });
    expect(
      await addTestShares(alibek, [testId], { regionIds: [], teacherIds: [] }),
    ).toEqual({ ok: false });
    expect(await db.testShare.count()).toBe(0);
  });
});
