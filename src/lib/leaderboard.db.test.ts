import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import {
  getOverallLeaderboard,
  getTestLeaderboard,
  getTestRank,
} from "./leaderboard";

let teacherId: string;

async function group(name: string) {
  return (await db.group.create({ data: { name } })).id;
}

async function student(
  fullName: string,
  groupId: string | null,
  isActive = true,
) {
  const user = await db.user.create({
    data: {
      username: fullName.toLowerCase().replace(/\s+/g, "_"),
      fullName,
      passwordHash: "x",
      groupId,
      isActive,
    },
  });
  return user.id;
}

async function test(title: string, durationMin = 10) {
  return (
    await db.test.create({
      data: { title, durationMin, createdById: teacherId, isActive: true },
    })
  ).id;
}

async function attempt(
  userId: string,
  testId: string,
  data: {
    score: number;
    durationSec: number;
    isFirst?: boolean;
    status?: "FINISHED" | "EXPIRED" | "IN_PROGRESS";
  },
) {
  const now = new Date();
  await db.attempt.create({
    data: {
      userId,
      testId,
      isFirst: data.isFirst ?? true,
      status: data.status ?? "FINISHED",
      score: data.score,
      maxScore: 10,
      durationSec: data.durationSec,
      startedAt: now,
      deadlineAt: new Date(now.getTime() + 600_000),
      finishedAt: now,
    },
  });
}

const names = (board: { entries: { fullName: string; rank: number }[] }) =>
  board.entries.map((e) => `${e.rank}:${e.fullName}`);

beforeEach(async () => {
  await resetDatabase();
  teacherId = (
    await db.user.create({
      data: {
        username: "t",
        fullName: "T",
        passwordHash: "x",
        role: "TEACHER",
      },
    })
  ).id;
});

describe("test reytingi", () => {
  it("score DESC, keyin durationSec ASC", async () => {
    const g = await group("G1");
    const t = await test("CSS");
    await attempt(await student("Ali", g), t, { score: 7, durationSec: 300 });
    await attempt(await student("Bek", g), t, { score: 9, durationSec: 500 });
    await attempt(await student("Dil", g), t, { score: 7, durationSec: 200 });

    expect(names(await getTestLeaderboard(t, { groupId: null }))).toEqual([
      "1:Bek",
      "2:Dil",
      "3:Ali",
    ]);
  });

  it("teng ball va vaqt bir xil o'rin oladi (RANK: 1, 1, 3)", async () => {
    const g = await group("G1");
    const t = await test("CSS");
    await attempt(await student("Ali", g), t, { score: 8, durationSec: 300 });
    await attempt(await student("Bek", g), t, { score: 8, durationSec: 300 });
    await attempt(await student("Dil", g), t, { score: 8, durationSec: 301 });

    const board = await getTestLeaderboard(t, { groupId: null });
    expect(names(board)).toEqual(["1:Ali", "1:Bek", "3:Dil"]);
    expect(board.total).toBe(3);
  });

  it("faqat birinchi urinish: qayta ishlash va tugallanmagan urinish reytingni o'zgartirmaydi", async () => {
    const g = await group("G1");
    const t = await test("CSS");
    const ali = await student("Ali", g);
    const bek = await student("Bek", g);
    await attempt(ali, t, { score: 3, durationSec: 300 });
    await attempt(ali, t, { score: 10, durationSec: 100, isFirst: false });
    await attempt(bek, t, { score: 5, durationSec: 300 });
    await attempt(await student("Dil", g), t, {
      score: 10,
      durationSec: 10,
      status: "IN_PROGRESS",
    });

    const board = await getTestLeaderboard(t, { groupId: null });
    expect(board.entries.map((e) => [e.fullName, e.score])).toEqual([
      ["Bek", 5],
      ["Ali", 3],
    ]);
  });

  it("muddati o'tgan tugallanmagan urinish o'qishdan oldin EXPIRED bo'lib hisoblanadi", async () => {
    const g = await group("G1");
    const t = await test("CSS", 5);
    const ali = await student("Ali", g);
    const started = new Date(Date.now() - 20 * 60_000);
    await db.attempt.create({
      data: {
        userId: ali,
        testId: t,
        isFirst: true,
        startedAt: started,
        deadlineAt: new Date(started.getTime() + 5 * 60_000),
      },
    });

    const board = await getTestLeaderboard(t, { groupId: null });
    expect(board.entries).toEqual([
      expect.objectContaining({
        fullName: "Ali",
        score: 0,
        durationSec: 300,
        rank: 1,
      }),
    ]);
  });

  it("guruh filtri: o'rinlar guruh ichida qayta hisoblanadi", async () => {
    const g1 = await group("G1");
    const g2 = await group("G2");
    const t = await test("CSS");
    await attempt(await student("Ali", g1), t, { score: 9, durationSec: 100 });
    await attempt(await student("Bek", g2), t, { score: 8, durationSec: 100 });
    await attempt(await student("Dil", g2), t, { score: 6, durationSec: 100 });

    expect(names(await getTestLeaderboard(t, { groupId: g2 }))).toEqual([
      "1:Bek",
      "2:Dil",
    ]);
    expect(names(await getTestLeaderboard(t, { groupId: null }))).toEqual([
      "1:Ali",
      "2:Bek",
      "3:Dil",
    ]);
  });

  it("bloklangan o'quvchi ko'rinmaydi", async () => {
    const g = await group("G1");
    const t = await test("CSS");
    await attempt(await student("Ali", g, false), t, {
      score: 10,
      durationSec: 100,
    });
    await attempt(await student("Bek", g), t, { score: 5, durationSec: 100 });

    expect(names(await getTestLeaderboard(t, { groupId: null }))).toEqual([
      "1:Bek",
    ]);
  });

  it("top N dan tashqaridagi o'quvchi 'me' da qaytadi", async () => {
    const g = await group("G1");
    const t = await test("CSS");
    for (const [i, name] of ["A1", "A2", "A3", "A4"].entries()) {
      await attempt(await student(name, g), t, {
        score: 10 - i,
        durationSec: 100,
      });
    }
    const last = await student("Oxirgi", g);
    await attempt(last, t, { score: 1, durationSec: 100 });

    const board = await getTestLeaderboard(t, {
      groupId: null,
      userId: last,
      limit: 2,
    });
    expect(names(board)).toEqual(["1:A1", "2:A2"]);
    expect(board.me).toMatchObject({ fullName: "Oxirgi", rank: 5 });
    expect(
      await getTestRank({ testId: t, userId: last, isFirst: true }),
    ).toEqual({ rank: 5, total: 5 });
    expect(
      await getTestRank({ testId: t, userId: last, isFirst: false }),
    ).toBeNull();
  });
});

describe("umumiy reyting", () => {
  it("birinchi urinishlar yig'indisi, teng bo'lsa umumiy vaqt kamrog'i yuqorida", async () => {
    const g1 = await group("G1");
    const g2 = await group("G2");
    const t1 = await test("CSS");
    const t2 = await test("HTML");
    const ali = await student("Ali", g1);
    const bek = await student("Bek", g2);
    const dil = await student("Dil", g1);
    await attempt(ali, t1, { score: 5, durationSec: 100 });
    await attempt(ali, t2, { score: 5, durationSec: 100 });
    await attempt(ali, t2, { score: 10, durationSec: 10, isFirst: false });
    await attempt(bek, t1, { score: 10, durationSec: 150 });
    await attempt(dil, t1, { score: 4, durationSec: 50 });

    const board = await getOverallLeaderboard({ groupId: null, userId: dil });
    expect(
      board.entries.map((e) => [
        e.rank,
        e.fullName,
        e.score,
        e.durationSec,
        e.tests,
        e.groupName,
      ]),
    ).toEqual([
      [1, "Bek", 10, 150, 1, "G2"],
      [2, "Ali", 10, 200, 2, "G1"],
      [3, "Dil", 4, 50, 1, "G1"],
    ]);
    expect(board.me?.rank).toBe(3);

    const group1 = await getOverallLeaderboard({ groupId: g1 });
    expect(names(group1)).toEqual(["1:Ali", "2:Dil"]);
  });
});
