import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleCheckIcon, CircleXIcon, TrophyIcon } from "lucide-react";
import { AttemptReview } from "@/components/results/attempt-review";
import { buttonVariants } from "@/components/ui/button";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { percent } from "@/lib/format";
import { formatDuration } from "@/lib/time";
import {
  isWithinDeadline,
  markFromPercent,
  PASS_PERCENT,
  type Mark,
} from "@/lib/grading";
import { getTestRank } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

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
      test: {
        select: {
          title: true,
          showAnswers: true,
          durationMin: true,
          allowRetake: true,
        },
      },
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
  const scorePercent = percent(score, maxScore);
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

      <MarkBanner
        mark={markFromPercent(scorePercent)}
        canRetake={attempt.test.allowRetake}
      />

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ball" value={`${score}/${maxScore}`} />
        <Stat label="Foiz" value={`${scorePercent}%`} />
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

const MARK_STYLES = {
  fail: {
    icon: CircleXIcon,
    title: "Afsuski, siz testdan o'ta olmadingiz",
    className: "border-destructive/50 bg-destructive/10 text-destructive",
  },
  4: {
    icon: CircleCheckIcon,
    title: "Tabriklaymiz! Siz 4 bahoga o'tdingiz",
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  5: {
    icon: TrophyIcon,
    title: "Ajoyib! Siz 5 bahoga o'tdingiz",
    className:
      "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
} as const;

function MarkBanner({ mark, canRetake }: { mark: Mark; canRetake: boolean }) {
  const { icon: Icon, title, className } = MARK_STYLES[mark];
  return (
    <div
      role="status"
      className={cn("flex items-start gap-3 rounded-lg border p-4", className)}
    >
      <Icon className="mt-0.5 size-6 shrink-0" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold">{title}</p>
        {mark === "fail" && (
          <p className="text-sm">
            O&apos;tish uchun kamida {PASS_PERCENT}% kerak.
            {canRetake && (
              <>
                {" "}
                <Link href="/dashboard" className="font-medium underline">
                  Qayta ishlab ko&apos;ring
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
