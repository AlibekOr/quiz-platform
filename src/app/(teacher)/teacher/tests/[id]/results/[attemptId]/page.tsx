import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { AttemptReview } from "@/components/results/attempt-review";
import { CancelAttemptButton } from "@/components/teacher/results/cancel-attempt-button";
import { Badge } from "@/components/ui/badge";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { percent } from "@/lib/format";
import { isAnswerCorrect } from "@/lib/grading";
import { formatDateTime, formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Urinish" };

export default async function TeacherAttemptPage({
  params,
}: PageProps<"/teacher/tests/[id]/results/[attemptId]">) {
  await requireTeacher();
  const { id: testId, attemptId } = await params;
  await finalizeExpiredAttempts({ testId });

  const attempt = await db.attempt.findFirst({
    where: { id: attemptId, testId },
    select: {
      id: true,
      userId: true,
      status: true,
      isFirst: true,
      score: true,
      maxScore: true,
      durationSec: true,
      startedAt: true,
      deadlineAt: true,
      questionOrder: true,
      user: {
        select: { fullName: true, group: { select: { name: true } } },
      },
      test: { select: { title: true } },
    },
  });
  if (!attempt) notFound();

  const [questions, siblings] = await Promise.all([
    db.question.findMany({
      where: { testId },
      orderBy: { order: "asc" },
      select: {
        id: true,
        text: true,
        type: true,
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
    }),
    db.attempt.findMany({
      where: { testId, userId: attempt.userId },
      orderBy: { startedAt: "asc" },
      select: {
        id: true,
        status: true,
        isFirst: true,
        score: true,
        maxScore: true,
        startedAt: true,
      },
    }),
  ]);

  // O'quvchi ko'rgan tartibda
  const position = new Map(attempt.questionOrder.map((qid, i) => [qid, i]));
  questions.sort(
    (a, b) =>
      (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity),
  );
  const review = questions.map((q) => {
    const answer = q.answers[0] ?? null;
    return {
      id: q.id,
      text: q.text,
      points: q.points,
      options: q.options,
      // Davom etayotgan urinish hali baholanmagan: ko'rsatish uchun joyida tekshiriladi
      answer: answer && {
        selectedOptionIds: answer.selectedOptionIds,
        isCorrect:
          answer.isCorrect ?? isAnswerCorrect(q, answer.selectedOptionIds),
      },
    };
  });

  const inProgress = attempt.status === "IN_PROGRESS";
  const score = attempt.score ?? 0;
  const maxScore = attempt.maxScore ?? 0;
  const resultsHref = `/teacher/tests/${testId}/results`;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={resultsHref}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Natijalar
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-muted-foreground text-sm break-words">
              {attempt.test.title}
            </p>
            <h1 className="text-2xl font-semibold break-words">
              <Link
                href={`/teacher/students/${attempt.userId}`}
                className="hover:underline"
              >
                {attempt.user.fullName}
              </Link>
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {attempt.user.group?.name ?? "Guruhsiz"}
              </span>
              {attempt.isFirst ? (
                <Badge>Birinchi urinish · reytingda</Badge>
              ) : (
                <Badge variant="secondary">Qayta urinish</Badge>
              )}
              {inProgress ? (
                <Badge variant="outline">Davom etmoqda</Badge>
              ) : attempt.status === "EXPIRED" ? (
                <Badge variant="outline">Vaqt tugagan</Badge>
              ) : null}
            </div>
          </div>
          <CancelAttemptButton
            attemptId={attempt.id}
            studentName={attempt.user.fullName}
            isFirst={attempt.isFirst}
            redirectTo={resultsHref}
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ball" value={inProgress ? "—" : `${score}/${maxScore}`} />
        <Stat
          label="Foiz"
          value={inProgress ? "—" : `${percent(score, maxScore)}%`}
        />
        <Stat
          label="Vaqt"
          value={
            attempt.durationSec === null
              ? "—"
              : formatDuration(attempt.durationSec)
          }
        />
        <Stat
          label={inProgress ? "Tugash vaqti" : "Boshlangan"}
          value={formatDateTime(
            inProgress ? attempt.deadlineAt : attempt.startedAt,
          )}
          small
        />
      </dl>

      {siblings.length > 1 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-medium">
            Shu testdagi barcha urinishlari ({siblings.length})
          </h2>
          <ul className="flex flex-wrap gap-2">
            {siblings.map((s, i) => (
              <li key={s.id}>
                <Link
                  href={`${resultsHref}/${s.id}`}
                  aria-current={s.id === attempt.id ? "page" : undefined}
                  className={cn(
                    "flex flex-col rounded-lg border px-3 py-1.5 text-sm",
                    s.id === attempt.id
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="font-medium tabular-nums">
                    {i + 1}.{" "}
                    {s.status === "IN_PROGRESS"
                      ? "davom etmoqda"
                      : `${s.score}/${s.maxScore}`}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDateTime(s.startedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Javoblar</h2>
        {inProgress && (
          <p className="text-muted-foreground text-sm">
            Urinish hali tugamagan: hozirgacha saqlangan javoblar
            ko&apos;rsatilmoqda.
          </p>
        )}
        <AttemptReview questions={review} selectedLabel="o'quvchi javobi" />
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd
        className={cn(
          "font-semibold tabular-nums",
          small ? "text-base" : "text-xl",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
