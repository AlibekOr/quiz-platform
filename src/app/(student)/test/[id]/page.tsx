import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  TestRunner,
  type RunnerQuestion,
} from "@/components/student/test-runner";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Test" };

// Har bir so'rovda serverning joriy vaqti (taymer klient soatiga bog'liq bo'lmasligi uchun)
function requestTime(): number {
  return Date.now();
}

export default async function TestPage({ params }: PageProps<"/test/[id]">) {
  const student = await requireStudent();
  const { id } = await params;
  await finalizeExpiredAttempts({ testId: id, userId: student.id });

  const attempt = await db.attempt.findFirst({
    where: { userId: student.id, testId: id, status: "IN_PROGRESS" },
    select: {
      id: true,
      deadlineAt: true,
      questionOrder: true,
      test: { select: { title: true } },
      answers: { select: { questionId: true, selectedOptionIds: true } },
    },
  });
  if (!attempt) redirect("/dashboard");

  // isCorrect bu yerda TANLANMAYDI — klientga hech qachon yuborilmaydi
  const rows = await db.question.findMany({
    where: { testId: id },
    orderBy: { order: "asc" },
    select: {
      id: true,
      text: true,
      type: true,
      points: true,
      options: { orderBy: { order: "asc" }, select: { id: true, text: true } },
    },
  });

  // Attempt boshlangandagi tartib; keyin qo'shilgan savollar oxirida
  const position = new Map(attempt.questionOrder.map((qid, i) => [qid, i]));
  const questions: RunnerQuestion[] = rows.sort(
    (a, b) =>
      (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity),
  );
  if (questions.length === 0) redirect("/dashboard");

  return (
    <TestRunner
      attemptId={attempt.id}
      title={attempt.test.title}
      deadlineAt={attempt.deadlineAt.getTime()}
      serverNow={requestTime()}
      questions={questions}
      initialAnswers={Object.fromEntries(
        attempt.answers.map((a) => [a.questionId, a.selectedOptionIds]),
      )}
    />
  );
}
