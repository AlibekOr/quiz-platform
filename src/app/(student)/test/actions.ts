"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { finalizeAttempt, finalizeExpiredAttempts } from "@/lib/attempts";
import { requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isWithinDeadline, shuffle } from "@/lib/grading";

const idSchema = z.string().min(1).max(64);

export async function startAttempt(testId: string): Promise<ActionResult> {
  const student = await requireStudent();
  const id = idSchema.parse(testId);
  if (!student.groupId)
    return { ok: false, error: "Siz hech qaysi guruhga biriktirilmagansiz" };
  const groupId = student.groupId;

  await finalizeExpiredAttempts({ testId: id, userId: student.id });

  const result = await db.$transaction(async (tx) => {
    // Bir user+test uchun parallel boshlashlar navbatga turadi: isFirst va "bitta IN_PROGRESS" kafolatlanadi
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`attempt:${student.id}:${id}`}))`;

    const test = await tx.test.findFirst({
      where: { id, isActive: true, groups: { some: { id: groupId } } },
      select: {
        durationMin: true,
        allowRetake: true,
        shuffleQuestions: true,
        questions: { orderBy: { order: "asc" }, select: { id: true } },
      },
    });
    if (!test || test.questions.length === 0)
      return { ok: false, error: "Test topilmadi yoki faol emas" } as const;

    const attempts = await tx.attempt.findMany({
      where: { userId: student.id, testId: id },
      select: { id: true, status: true },
    });
    if (attempts.some((a) => a.status === "IN_PROGRESS"))
      return { ok: true } as const;
    if (attempts.length > 0 && !test.allowRetake)
      return { ok: false, error: "Bu testni qayta ishlab bo'lmaydi" } as const;

    const ids = test.questions.map((q) => q.id);
    const now = new Date();
    await tx.attempt.create({
      data: {
        userId: student.id,
        testId: id,
        isFirst: attempts.length === 0,
        startedAt: now,
        deadlineAt: new Date(now.getTime() + test.durationMin * 60_000),
        questionOrder: test.shuffleQuestions ? shuffle(ids) : ids,
      },
    });
    return { ok: true } as const;
  });

  if (!result.ok) return result;
  redirect(`/test/${id}`);
}

export type SaveAnswerResult =
  { ok: true } | { ok: false; error: string; expired?: boolean };

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  optionIds: string[],
): Promise<SaveAnswerResult> {
  const student = await requireStudent();
  const parsed = z
    .object({
      attemptId: idSchema,
      questionId: idSchema,
      optionIds: z.array(idSchema).max(10),
    })
    .safeParse({ attemptId, questionId, optionIds });
  if (!parsed.success) return { ok: false, error: "Noto'g'ri so'rov" };

  const attempt = await db.attempt.findFirst({
    where: { id: parsed.data.attemptId, userId: student.id },
    select: {
      status: true,
      deadlineAt: true,
      testId: true,
      questionOrder: true,
    },
  });
  if (!attempt) return { ok: false, error: "Urinish topilmadi" };
  if (attempt.status !== "IN_PROGRESS")
    return { ok: false, error: "Test yakunlangan", expired: true };
  if (!isWithinDeadline(attempt.deadlineAt, new Date())) {
    return { ok: false, error: "Vaqt tugadi", expired: true };
  }

  const question = await db.question.findFirst({
    where: { id: parsed.data.questionId, testId: attempt.testId },
    select: { type: true, options: { select: { id: true } } },
  });
  if (!question) return { ok: false, error: "Savol topilmadi" };

  const selected = [...new Set(parsed.data.optionIds)];
  const valid = new Set(question.options.map((o) => o.id));
  if (selected.some((o) => !valid.has(o)))
    return { ok: false, error: "Noto'g'ri variant" };
  if (question.type === "SINGLE" && selected.length > 1)
    return { ok: false, error: "Faqat bitta variant tanlanadi" };

  await db.answer.upsert({
    where: {
      attemptId_questionId: {
        attemptId: parsed.data.attemptId,
        questionId: parsed.data.questionId,
      },
    },
    create: {
      attemptId: parsed.data.attemptId,
      questionId: parsed.data.questionId,
      selectedOptionIds: selected,
    },
    update: { selectedOptionIds: selected },
  });
  return { ok: true };
}

export async function submitAttempt(attemptId: string): Promise<ActionResult> {
  const student = await requireStudent();
  const id = idSchema.parse(attemptId);

  const attempt = await db.attempt.findFirst({
    where: { id, userId: student.id },
    select: { status: true, deadlineAt: true },
  });
  if (!attempt) return { ok: false, error: "Urinish topilmadi" };

  if (attempt.status === "IN_PROGRESS") {
    const now = new Date();
    // Deadline + 5s dan keyin kelgan topshirish EXPIRED: vaqt to'liq hisoblanadi
    const status = isWithinDeadline(attempt.deadlineAt, now)
      ? "FINISHED"
      : "EXPIRED";
    await db.$transaction((tx) => finalizeAttempt(tx, id, status, now));
  }
  redirect(`/result/${id}`);
}
