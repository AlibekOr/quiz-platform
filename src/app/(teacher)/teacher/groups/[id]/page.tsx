import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarDaysIcon } from "lucide-react";
import { RemoveFromGroupButton } from "@/components/teacher/groups/remove-from-group-button";
import { ScheduleForm } from "@/components/teacher/groups/schedule-form";
import { SemestersSection } from "@/components/teacher/grades/semesters-section";
import { buttonVariants } from "@/components/ui/button";
import { groupScopeWhere } from "@/lib/auth/scope";
import { requireTeacherScope } from "@/lib/auth/staff";
import { semesterInfo } from "@/lib/grades-data";
import { groupLabel } from "@/lib/group-label";
import { db } from "@/lib/db";
import { getTemplateOptions } from "@/lib/templates";
import { formatSchedule } from "@/lib/time";

export const metadata: Metadata = { title: "Guruh" };

export default async function GroupPage({
  params,
}: PageProps<"/teacher/groups/[id]">) {
  const { user, scope } = await requireTeacherScope();
  const { id } = await params;

  // Boshqa o'qituvchining guruhi — 404 (borligi ham bilinmaydi)
  const group = await db.group.findFirst({
    where: { id, ...groupScopeWhere(scope) },
    select: {
      id: true,
      name: true,
      code: true,
      schedules: {
        orderBy: { weekday: "asc" },
        select: { weekday: true, startTime: true, endTime: true },
      },
      students: {
        where: { role: "STUDENT", archivedAt: null },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, username: true, isActive: true },
      },
      semesters: {
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          closed: true,
          maxTotal: true,
          passPercent: true,
          failBelow: true,
          extraMode: true,
          extraBeyondMax: true,
          categories: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              kind: true,
              cap: true,
              itemMin: true,
              itemMax: true,
              step: true,
            },
          },
          group: { select: { id: true, name: true, code: true } },
          _count: { select: { assignments: true } },
        },
      },
    },
  });
  if (!group) notFound();
  const templates = await getTemplateOptions(user.id);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          prefetch={false}
          href="/teacher/groups"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Guruhlar
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            {group.code && (
              <p className="text-muted-foreground font-mono text-sm">
                {group.code}
              </p>
            )}
            <p className="text-muted-foreground text-sm">
              {formatSchedule(group.schedules) || "Dars jadvali kiritilmagan"}
            </p>
          </div>
          <Link
            prefetch={false}
            href={`/teacher/attendance/report?group=${group.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <CalendarDaysIcon />
            Davomat hisoboti
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="font-semibold">Dars jadvali</h2>
          <ScheduleForm groupId={group.id} initial={group.schedules} />
        </section>

        <section className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="font-semibold">
            O&apos;quvchilar ({group.students.length})
          </h2>
          {group.students.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Guruhda o&apos;quvchi yo&apos;q.
            </p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {group.students.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <Link
                    prefetch={false}
                    href={`/teacher/students/${s.id}`}
                    className="font-medium hover:underline"
                  >
                    {s.fullName}
                  </Link>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground font-mono text-xs">
                      {s.username}
                      {!s.isActive && " · bloklangan"}
                    </span>
                    <RemoveFromGroupButton
                      student={{ ...s, groupName: groupLabel(group) }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border p-4 lg:col-span-2">
          <SemestersSection
            groupId={group.id}
            templates={templates}
            semesters={group.semesters.map(({ _count, ...s }) => {
              const info = semesterInfo(s);
              return {
                id: info.id,
                name: info.name,
                startDate: info.startDate,
                endDate: info.endDate,
                closed: info.closed,
                ended: info.ended,
                rules: info.rules,
                assignmentCount: _count.assignments,
              };
            })}
          />
        </section>
      </div>
    </>
  );
}
