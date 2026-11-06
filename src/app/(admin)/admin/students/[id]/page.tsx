import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { SemesterCard } from "@/components/grades/semester-card";
import { requireAdmin } from "@/lib/auth/guards";
import { computeStats } from "@/lib/attendance";
import { db } from "@/lib/db";
import { getStudentSemesters } from "@/lib/grades-data";
import { groupLabel } from "@/lib/group-label";
import { formatPhone } from "@/lib/students/format";
import { formatDate, fromDbDate, todayInTashkent } from "@/lib/time";

export const metadata: Metadata = { title: "O'quvchi" };

// ADMIN: o'quvchi kartochkasi — guruh tarixi, davomat, semestr baholari, aloqa (faqat ko'rish)
export default async function AdminStudentPage({
  params,
}: PageProps<"/admin/students/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const student = await db.user.findFirst({
    where: { id, role: "STUDENT" },
    select: {
      id: true,
      fullName: true,
      username: true,
      archivedAt: true,
      group: {
        select: {
          name: true,
          code: true,
          teacher: { select: { fullName: true } },
        },
      },
      profile: {
        select: {
          phone: true,
          telegram: true,
          parentName: true,
          parentPhone: true,
        },
      },
      attendances: { select: { status: true } },
      memberships: {
        orderBy: { joinedAt: "desc" },
        select: {
          id: true,
          joinedAt: true,
          leftAt: true,
          group: {
            select: {
              name: true,
              code: true,
              teacher: { select: { fullName: true } },
            },
          },
        },
      },
    },
  });
  if (!student) notFound();
  const semesters = await getStudentSemesters(student.id);
  const stats = computeStats(student.attendances.map((a) => a.status));

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          prefetch={false}
          href="/admin/students"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          O&apos;quvchilar
        </Link>
        <h1 className="text-2xl font-semibold">{student.fullName}</h1>
        <p className="text-muted-foreground text-sm">
          {student.username} ·{" "}
          {student.group
            ? `${groupLabel(student.group)} · ${student.group.teacher.fullName}`
            : "Guruhsiz"}
          {student.archivedAt &&
            ` · arxivda (${formatDate(todayInTashkent(student.archivedAt))})`}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-lg border p-4 text-sm">
          <h2 className="font-semibold">Aloqa</h2>
          <span>
            Telefon:{" "}
            {student.profile?.phone ? formatPhone(student.profile.phone) : "—"}
          </span>
          <span>Telegram: {student.profile?.telegram || "—"}</span>
          <span>
            Ota-ona: {student.profile?.parentName || "—"}
            {student.profile?.parentPhone &&
              `, ${formatPhone(student.profile.parentPhone)}`}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border p-4 text-sm">
          <h2 className="font-semibold">Davomat (barcha darslar)</h2>
          <span>
            {stats.percent === null
              ? "Hali dars yo'q"
              : `${stats.percent}% · ${stats.present} / ${stats.total} dars, ${stats.late} kechikish`}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Guruhlar tarixi</h2>
        <ul className="divide-y rounded-lg border text-sm">
          {student.memberships.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap justify-between gap-2 p-2.5"
            >
              <span>
                {groupLabel(m.group)} · {m.group.teacher.fullName}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {formatDate(fromDbDate(m.joinedAt))} –{" "}
                {m.leftAt ? formatDate(fromDbDate(m.leftAt)) : "hozir"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {semesters.map((data) => (
        <SemesterCard
          key={data.semester.id}
          data={data}
          student={data.students[0]}
        />
      ))}
    </>
  );
}
