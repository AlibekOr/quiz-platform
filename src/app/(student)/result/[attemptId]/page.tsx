import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AttemptReview } from "@/components/results/attempt-review";
import { buttonVariants } from "@/components/ui/button";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { percent } from "@/lib/format";
import { formatDuration } from "@/lib/time";
import { isWithinDeadline } from "@/lib/grading";
import { getTestRank } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Natija" };

async function loadAttempt(attemptId: string, userId: string) {
  // userId sharti: faqat o'z natijasi. Begona attempt uchun 404 (mavjudligi oshkor qilinmaydi)
  return db.attempt.findFirst({
    where: { id: attemptId, userId },
    select: {
      id: true,
      testId: true,
      status: true,
      isFirst: true,
      score: true,
      maxScore: true,
      durationSec: true,
      deadlineAt: true,
      questionOrder: true,
      test: { select: { title: true, showAnswers: true, durationMin: true } },
    },
  });
}

export default async function ResultPage({
  params,
}: PageProps<"/result/[attemptId]">) {
  const student = await requireStudent();
  const { attemptId } = await params;

  let attempt = await loadAttempt(attemptId, student.id);
  if (!attempt) notFound();
  if (attempt.status === "IN_PROGRESS") {
    if (isWithinDeadline(attempt.deadlineAt, new Date()))
      redirect(`/test/${attempt.testId}`);
    await finalizeExpiredAttempts({
      testId: attempt.testId,
      userId: student.id,
    });
    attempt = await loadAttempt(attemptId, student.id);
    if (!attempt || attempt.status === "IN_PROGRESS") notFound();
  }

  const score = attempt.score ?? 0;
  const maxScore = attempt.maxScore ?? 0;
  const rank = await getTestRank({
    testId: attempt.testId,
    userId: student.id,
    isFirst: attempt.isFirst,
  });

  const review = attempt.test.showAnswers
    ? await db.question.findMany({
        where: { testId: attempt.testId },
        orderBy: { order: "asc" },
        select: {
          id: true,
          text: true,
          points: true,
          options: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, isCorrect: true },
          },
          answers: {
            where: { attemptId: attempt.id },
            select: { selectedOptionIds: true, isCorrect: true },
          },
        },
      })
    : null;
  const position = new Map(attempt.questionOrder.map((qid, i) => [qid, i]));
  review?.sort(
    (a, b) =>
      (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity),
  );

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Natija</p>
        <h1 className="text-2xl font-semibold break-words">
          {attempt.test.title}
        </h1>
      </div>

      {attempt.status === "EXPIRED" && (
        <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
          Vaqt tugagani uchun test saqlangan javoblar bo&apos;yicha avtomatik
          topshirildi.
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ball" value={`${score}/${maxScore}`} />
        <Stat label="Foiz" value={`${percent(score, maxScore)}%`} />
        <Stat label="Vaqt" value={formatDuration(attempt.durationSec ?? 0)} />
        <Stat
          label="O'rin"
          value={rank ? `${rank.rank}/${rank.total}` : "—"}
          hint={
            attempt.isFirst ? undefined : "Qayta urinish reytingga kirmaydi"
          }
        />
      </dl>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "outline" })}
        >
          Testlarimga qaytish
        </Link>
        <Link
          href={`/test/${attempt.testId}/leaderboard`}
          className={buttonVariants({ variant: "outline" })}
        >
          Test reytingi
        </Link>
      </div>

      {review && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            Savollar bo&apos;yicha tahlil
          </h2>
          <AttemptReview
            selectedLabel="sizning javobingiz"
            questions={review.map((q) => ({
              ...q,
              answer: q.answers[0] ?? null,
            }))}
          />
        </section>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-muted-foreground text-xs">{hint}</dd>}
    </div>
  );
}
