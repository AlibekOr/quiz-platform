import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarDaysIcon } from "lucide-react";
import { ScheduleForm } from "@/components/teacher/groups/schedule-form";
import { buttonVariants } from "@/components/ui/button";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatSchedule } from "@/lib/time";

export const metadata: Metadata = { title: "Guruh" };

export default async function GroupPage({
  params,
}: PageProps<"/teacher/groups/[id]">) {
  await requireTeacher();
  const { id } = await params;

  const group = await db.group.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      schedules: {
        orderBy: { weekday: "asc" },
        select: { weekday: true, startTime: true, endTime: true },
      },
      students: {
        where: { role: "STUDENT" },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true, username: true, isActive: true },
      },
    },
  });
  if (!group) notFound();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href="/teacher/groups"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Guruhlar
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{group.name}</h1>
            <p className="text-muted-foreground text-sm">
              {formatSchedule(group.schedules) || "Dars jadvali kiritilmagan"}
            </p>
          </div>
          <Link
            href={`/teacher/groups/${group.id}/attendance`}
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
                    href={`/teacher/students/${s.id}`}
                    className="font-medium hover:underline"
                  >
                    {s.fullName}
                  </Link>
                  <span className="text-muted-foreground font-mono text-xs">
                    {s.username}
                    {!s.isActive && " · bloklangan"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
