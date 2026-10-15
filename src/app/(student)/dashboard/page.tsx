import type { Metadata } from "next";
import Link from "next/link";
import { SemesterCard } from "@/components/grades/semester-card";
import { StartTestButton } from "@/components/student/start-test-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getStudentSemesters } from "@/lib/grades-data";
import { testState } from "@/lib/tests/schedule";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoment,
  fromDbDate,
  toDbDate,
  todayInTashkent,
} from "@/lib/time";

export const metadata: Metadata = { title: "Testlarim" };

export default async function DashboardPage() {
  const student = await requireStudent();
  await finalizeExpiredAttempts({ userId: student.id });

  const now = new Date();
  const today = todayInTashkent(now);
  const [tests, results, current] = await Promise.all([
    student.groupId
      ? db.test.findMany({
          // Ochiq va hali ochilmaganlar; muddati o'tganlar yashiriladi (natijasi "Natijalarim" da)
          where: {
            isActive: true,
            groups: { some: { id: student.groupId } },
            OR: [
              { endsAt: null },
              { endsAt: { gt: now } },
              {
                attempts: {
                  some: { userId: student.id, status: "IN_PROGRESS" },
                },
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            durationMin: true,
            allowRetake: true,
            isActive: true,
            startsAt: true,
            endsAt: true,
            _count: { select: { questions: true } },
            attempts: {
              where: { userId: student.id },
              orderBy: { startedAt: "desc" },
              select: { id: true, status: true, score: true, maxScore: true },
            },
          },
        })
      : [],
    db.attempt.findMany({
      where: { userId: student.id, status: { in: ["FINISHED", "EXPIRED"] } },
      orderBy: { finishedAt: "desc" },
      take: 20,
      select: {
        id: true,
        score: true,
        maxScore: true,
        durationSec: true,
        finishedAt: true,
        isFirst: true,
        test: { select: { title: true } },
      },
    }),
    // Bosh sahifada bitta semestr jadvali
    getStudentSemesters(student.id).then(
      (list) =>
        // Joriy, bo'lmasa eng yaqin boshlanadigan, bo'lmasa oxirgi (ro'yxat yangisi birinchi)
        list.find(
          (s) => s.semester.startDate <= today && today <= s.semester.endDate,
        ) ??
        list.findLast((s) => s.semester.startDate > today) ??
        list[0] ??
        null,
    ),
  ]);
  const me = current?.students[0] ?? null;
  // Avval ochiqlar, keyin eng yaqin ochiladiganlar
  const upcomingFirst = (t: (typeof tests)[number]) =>
    testState(t, now) === "upcoming" ? (t.startsAt?.getTime() ?? 0) : 0;
  tests.sort((a, b) => upcomingFirst(a) - upcomingFirst(b));
  // Joriy semestrda darsga kelmagan kunlar (sababsiz va sababli)
  const absences = current
    ? await db.attendance.findMany({
        where: {
          studentId: student.id,
          status: { in: ["ABSENT", "EXCUSED"] },
          lesson: {
            date: {
              gte: toDbDate(current.semester.startDate),
              lte: toDbDate(today),
            },
          },
        },
        orderBy: { lesson: { date: "desc" } },
        select: {
          status: true,
          note: true,
          lesson: { select: { date: true } },
        },
      })
    : [];

  return (
    <>
      <h1 className="text-2xl font-semibold">Salom, {student.fullName}</h1>

      {current && me && <SemesterCard data={current} student={me} summary />}

      {current && (
        <section className="flex flex-col gap-2 rounded-lg border p-4">
          <h2 className="font-semibold">Darsga kelmagan kunlar</h2>
          {absences.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Bu semestrda dars qoldirmagansiz.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {absences.map((a) => {
                const excused = a.status === "EXCUSED";
                return (
                  <li key={a.lesson.date.toISOString()}>
                    <Badge
                      variant={excused ? "outline" : "destructive"}
                      title={a.note ?? undefined}
                    >
                      {formatDate(fromDbDate(a.lesson.date))} ·{" "}
                      {excused ? "sababli" : "sababsiz (−1)"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Mavjud testlar</h2>
          {student.groupId && (
            <Link
              prefetch={false}
              href="/tests/leaderboard"
              className="text-muted-foreground text-sm hover:underline"
            >
              Test reytingi
            </Link>
          )}
        </div>
        {!student.groupId ? (
          <p className="text-muted-foreground">
            Siz hali guruhga biriktirilmagansiz. O&apos;qituvchingizga murojaat
            qiling.
          </p>
        ) : tests.length === 0 ? (
          <p className="text-muted-foreground">Hozircha faol test yo&apos;q.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tests.map((t) => {
              const inProgress = t.attempts.find(
                (a) => a.status === "IN_PROGRESS",
              );
              const lastDone = t.attempts.find(
                (a) => a.status !== "IN_PROGRESS",
              );
              const upcoming = !inProgress && testState(t, now) === "upcoming";
              const info = {
                id: t.id,
                title: t.title,
                durationMin: t.durationMin,
                questionCount: t._count.questions,
                // Davomiylik tugashidan oldin yopilsa, o'quvchi oldindan ogohlantiriladi
                closesAt:
                  t.endsAt &&
                  now.getTime() + t.durationMin * 60_000 > t.endsAt.getTime()
                    ? formatMoment(t.endsAt, now)
                    : null,
              };
              return (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{t.title}</span>
                      {inProgress ? (
                        <Badge>Davom etmoqda</Badge>
                      ) : upcoming && t.startsAt ? (
                        <Badge variant="outline">
                          Ochiladi: {formatMoment(t.startsAt, now)}
                        </Badge>
                      ) : lastDone ? (
                        <Badge variant="secondary">
                          Tugatilgan: {lastDone.score}/{lastDone.maxScore}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Boshlanmagan</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t._count.questions} ta savol · {t.durationMin} daqiqa
                      {t.endsAt &&
                        !upcoming &&
                        ` · ${formatMoment(t.endsAt, now)} gacha ochiq`}
                      {t.description && ` · ${t.description}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {inProgress ? (
                      <Link
                        prefetch={false}
                        href={`/test/${t.id}`}
                        className={buttonVariants()}
                      >
                        Davom ettirish
                      </Link>
                    ) : upcoming ? null : lastDone ? (
                      <>
                        <Link
                          prefetch={false}
                          href={`/result/${lastDone.id}`}
                          className={buttonVariants({ variant: "outline" })}
                        >
                          Natija
                        </Link>
                        {t.allowRetake && (
                          <StartTestButton
                            test={info}
                            label="Qayta ishlash"
                            isRetake
                          />
                        )}
                      </>
                    ) : (
                      <StartTestButton
                        test={info}
                        label="Boshlash"
                        isRetake={false}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {results.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Natijalarim</h2>
          <ul className="divide-y rounded-lg border">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  prefetch={false}
                  href={`/result/${r.id}`}
                  className="hover:bg-muted/50 flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">
                    {r.test.title}
                    {!r.isFirst && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · qayta urinish
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {r.score}/{r.maxScore} ·{" "}
                    {formatDuration(r.durationSec ?? 0)} ·{" "}
                    {r.finishedAt && formatDateTime(r.finishedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
