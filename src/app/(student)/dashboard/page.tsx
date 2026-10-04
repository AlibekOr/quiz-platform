import type { Metadata } from "next";
import Link from "next/link";
import { StartTestButton } from "@/components/student/start-test-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDateTime, formatDuration } from "@/lib/format";

export const metadata: Metadata = { title: "Testlarim" };

export default async function DashboardPage() {
  const student = await requireStudent();
  await finalizeExpiredAttempts({ userId: student.id });

  const [tests, results] = await Promise.all([
    student.groupId
      ? db.test.findMany({
          where: { isActive: true, groups: { some: { id: student.groupId } } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            durationMin: true,
            allowRetake: true,
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
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold">Salom, {student.fullName}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Mavjud testlar</h2>
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
              const info = {
                id: t.id,
                title: t.title,
                durationMin: t.durationMin,
                questionCount: t._count.questions,
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
                      {t.description && ` · ${t.description}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {inProgress ? (
                      <Link href={`/test/${t.id}`} className={buttonVariants()}>
                        Davom ettirish
                      </Link>
                    ) : lastDone ? (
                      <>
                        <Link
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
