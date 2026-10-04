import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDuration, percent } from "@/lib/format";
import { isWithinDeadline } from "@/lib/grading";
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
  const rank = await getTestRank(attempt);

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
      </div>

      {review && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">
            Savollar bo&apos;yicha tahlil
          </h2>
          <ol className="flex flex-col gap-3">
            {review.map((q, i) => {
              const answer = q.answers[0];
              const selected = new Set(answer?.selectedOptionIds ?? []);
              const correct = answer?.isCorrect === true;
              return (
                <li
                  key={q.id}
                  className="flex flex-col gap-3 rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{i + 1}.</span>
                    {correct ? (
                      <Badge>To&apos;g&apos;ri · +{q.points}</Badge>
                    ) : selected.size === 0 ? (
                      <Badge variant="secondary">Javob berilmagan</Badge>
                    ) : (
                      <Badge variant="destructive">Noto&apos;g&apos;ri</Badge>
                    )}
                  </div>
                  <p className="break-words whitespace-pre-wrap">{q.text}</p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {q.options.map((o, oi) => (
                      <li
                        key={o.id}
                        className={cn(
                          "flex items-start gap-2 rounded-md border px-3 py-2",
                          o.isCorrect && "border-primary/50 bg-primary/10",
                          selected.has(o.id) &&
                            !o.isCorrect &&
                            "border-destructive/50 bg-destructive/10",
                        )}
                      >
                        <span className="text-muted-foreground">
                          {String.fromCharCode(65 + oi)})
                        </span>
                        <span className="min-w-0 flex-1 break-words">
                          {o.text}
                        </span>
                        {selected.has(o.id) && (
                          <span className="text-muted-foreground shrink-0">
                            sizning javobingiz
                          </span>
                        )}
                        {o.isCorrect ? (
                          <CheckIcon
                            className="size-4 shrink-0"
                            aria-label="To'g'ri javob"
                          />
                        ) : selected.has(o.id) ? (
                          <XIcon
                            className="text-destructive size-4 shrink-0"
                            aria-label="Noto'g'ri"
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
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
