import type { Metadata } from "next";
import { SemesterCard } from "@/components/grades/semester-card";
import { StudentTests } from "@/components/student/student-tests";
import { Badge } from "@/components/ui/badge";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireStudent } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getStudentSemesters } from "@/lib/grades-data";
import { formatDate, fromDbDate, toDbDate, todayInTashkent } from "@/lib/time";

export const metadata: Metadata = { title: "Bosh sahifa" };

export default async function DashboardPage() {
  const student = await requireStudent();
  await finalizeExpiredAttempts({ userId: student.id });

  const now = new Date();
  const today = todayInTashkent(now);
  // Bosh sahifada bitta semestr jadvali: joriy, bo'lmasa eng yaqin boshlanadigan,
  // bo'lmasa oxirgi (ro'yxat yangisi birinchi)
  const semesters = await getStudentSemesters(student.id);
  const current =
    semesters.find(
      (s) => s.semester.startDate <= today && today <= s.semester.endDate,
    ) ??
    semesters.findLast((s) => s.semester.startDate > today) ??
    semesters[0] ??
    null;
  const me = current?.students[0] ?? null;
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

      <StudentTests student={student} />
    </>
  );
}
