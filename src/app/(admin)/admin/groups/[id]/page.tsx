import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { GradeSheetTable } from "@/components/teacher/grades/grade-sheet-table";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { passScore } from "@/lib/grades";
import { currentSemesterId, getSemesterGrades } from "@/lib/grades-data";
import { groupLabel } from "@/lib/group-label";
import { formatDate, formatSchedule } from "@/lib/time";

export const metadata: Metadata = { title: "Guruh" };

// ADMIN: guruh kartochkasi — o'quvchilar, jadval, joriy semestr baholari (faqat ko'rish)
export default async function AdminGroupPage({
  params,
}: PageProps<"/admin/groups/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const group = await db.group.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      code: true,
      region: { select: { name: true } },
      teacher: { select: { fullName: true } },
      schedules: {
        orderBy: { weekday: "asc" },
        select: { weekday: true, startTime: true, endTime: true },
      },
      students: {
        where: { role: "STUDENT", archivedAt: null },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, username: true },
      },
    },
  });
  if (!group) notFound();
  const semesterId = await currentSemesterId(group.id);
  const grades = semesterId ? await getSemesterGrades(semesterId) : null;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          prefetch={false}
          href="/admin/groups"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Guruhlar
        </Link>
        <h1 className="text-2xl font-semibold">{groupLabel(group)}</h1>
        <p className="text-muted-foreground text-sm">
          {group.teacher.fullName} · {group.region?.name ?? "regionsiz"} ·{" "}
          {formatSchedule(group.schedules) || "jadval yo'q"}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">
          O&apos;quvchilar ({group.students.length})
        </h2>
        {group.students.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            O&apos;quvchi yo&apos;q.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border text-sm">
            {group.students.map((s, i) => (
              <li key={s.id} className="flex justify-between gap-2 p-2.5">
                <Link
                  prefetch={false}
                  href={`/admin/students/${s.id}`}
                  className="hover:underline"
                >
                  <span className="text-muted-foreground mr-1.5 tabular-nums">
                    {i + 1}.
                  </span>
                  {s.fullName}
                </Link>
                <span className="text-muted-foreground font-mono text-xs">
                  {s.username}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Joriy semestr</h2>
        {!grades ? (
          <p className="text-muted-foreground text-sm">
            Bugun ichiga tushadigan semestr yo&apos;q.
          </p>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              {grades.semester.name} · {formatDate(grades.semester.startDate)} –{" "}
              {formatDate(grades.semester.endDate)} · jami{" "}
              {grades.semester.rules.maxTotal}, o&apos;tish{" "}
              {passScore(grades.semester.rules)}
            </p>
            <GradeSheetTable
              students={grades.students}
              categories={grades.semester.rules.categories}
              studentHref={(sid) => `/admin/students/${sid}`}
            />
          </>
        )}
      </section>
    </>
  );
}
