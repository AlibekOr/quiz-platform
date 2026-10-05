import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import { cancelAttempt } from "./attempts";

let userId: string;
let testId: string;

async function attempt(isFirst: boolean, minutesAgo: number) {
  const startedAt = new Date(Date.now() - minutesAgo * 60_000);
  return (
    await db.attempt.create({
      data: {
        userId,
        testId,
        isFirst,
        status: "FINISHED",
        score: 5,
        maxScore: 10,
        durationSec: 60,
        startedAt,
        deadlineAt: new Date(startedAt.getTime() + 600_000),
        finishedAt: startedAt,
      },
    })
  ).id;
}

const firstFlags = async () =>
  (
    await db.attempt.findMany({
      where: { userId, testId },
      orderBy: { startedAt: "asc" },
      select: { id: true, isFirst: true },
    })
  ).map((a) => [a.id, a.isFirst]);

beforeEach(async () => {
  await resetDatabase();
  const teacher = await db.user.create({
    data: { username: "t", fullName: "T", passwordHash: "x", role: "TEACHER" },
  });
  userId = (
    await db.user.create({
      data: { username: "s", fullName: "S", passwordHash: "x" },
    })
  ).id;
  testId = (
    await db.test.create({
      data: { title: "CSS", durationMin: 10, createdById: teacher.id },
    })
  ).id;
});

describe("cancelAttempt", () => {
  it("birinchi urinish o'chsa, qolganlardan eng oldingisi birinchi bo'ladi", async () => {
    const a1 = await attempt(true, 30);
    const a2 = await attempt(false, 20);
    const a3 = await attempt(false, 10);

    expect(await cancelAttempt(a1)).toEqual({ userId, testId });
    expect(await firstFlags()).toEqual([
      [a2, true],
      [a3, false],
    ]);
  });

  it("qayta urinish o'chsa, birinchi urinish o'zgarmaydi", async () => {
    const a1 = await attempt(true, 30);
    const a2 = await attempt(false, 20);

    await cancelAttempt(a2);
    expect(await firstFlags()).toEqual([[a1, true]]);
  });

  it("yagona urinish o'chsa, javoblari ham o'chadi; mavjud bo'lmagan urinish uchun null", async () => {
    const a1 = await attempt(true, 30);
    const question = await db.question.create({
      data: { testId, text: "Q", order: 0 },
    });
    await db.answer.create({
      data: { attemptId: a1, questionId: question.id, selectedOptionIds: [] },
    });

    await cancelAttempt(a1);
    expect(await firstFlags()).toEqual([]);
    expect(await db.answer.count()).toBe(0);
    expect(await cancelAttempt(a1)).toBeNull();
  });
});
