import "server-only";
import type { AttemptStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  computeDurationSec,
  DEADLINE_GRACE_MS,
  gradeAttempt,
} from "@/lib/grading";

type Tx = Prisma.TransactionClient;

/**
 * Attemptni baholab yopadi. Faqat IN_PROGRESS bo'lsa ishlaydi (shartli update) —
 * ikki marta topshirish yoki parallel finalize natijani ikki marta yozmaydi.
 * @returns true — shu chaqiruv yopdi
 */
export async function finalizeAttempt(
  tx: Tx,
  attemptId: string,
  status: Exclude<AttemptStatus, "IN_PROGRESS">,
  now: Date,
): Promise<boolean> {
  const attempt = await tx.attempt.findUnique({
    where: { id: attemptId },
    select: {
      status: true,
      startedAt: true,
      deadlineAt: true,
      test: {
        select: {
          durationMin: true,
          questions: {
            select: {
              id: true,
              type: true,
              points: true,
              options: { select: { id: true, isCorrect: true } },
            },
          },
        },
      },
      answers: { select: { questionId: true, selectedOptionIds: true } },
    },
  });
  if (!attempt || attempt.status !== "IN_PROGRESS") return false;

  const { test } = attempt;
  const answers = new Map(
    attempt.answers.map((a) => [a.questionId, a.selectedOptionIds]),
  );
  const { score, maxScore, correctness } = gradeAttempt(
    test.questions,
    answers,
  );

  const finishedAt = status === "EXPIRED" ? attempt.deadlineAt : now;
  const durationSec =
    status === "EXPIRED"
      ? test.durationMin * 60
      : computeDurationSec(attempt.startedAt, now, test.durationMin);

  const { count } = await tx.attempt.updateMany({
    where: { id: attemptId, status: "IN_PROGRESS" },
    data: { status, score, maxScore, finishedAt, durationSec },
  });
  if (count === 0) return false;

  for (const a of attempt.answers) {
    await tx.answer.updateMany({
      where: { attemptId, questionId: a.questionId },
      data: { isCorrect: correctness.get(a.questionId) ?? false },
    });
  }
  return true;
}

/**
 * Muddati (deadline + 5s) o'tgan, lekin topshirilmagan attemptlarni saqlangan javoblar
 * bo'yicha baholab EXPIRED qiladi. Natija va reyting o'qilishidan oldin chaqiriladi.
 */
export async function finalizeExpiredAttempts(
  filter: { testId?: string; userId?: string } = {},
): Promise<number> {
  const now = new Date();
  const expired = await db.attempt.findMany({
    where: {
      ...filter,
      status: "IN_PROGRESS",
      deadlineAt: { lt: new Date(now.getTime() - DEADLINE_GRACE_MS) },
    },
    select: { id: true },
  });

  let finalized = 0;
  for (const { id } of expired) {
    const done = await db.$transaction((tx) =>
      finalizeAttempt(tx, id, "EXPIRED", now),
    );
    if (done) finalized++;
  }
  return finalized;
}
