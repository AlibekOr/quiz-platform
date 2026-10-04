import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2Icon, CircleDashedIcon } from "lucide-react";
import { AttendanceDatePicker } from "@/components/teacher/attendance/date-picker";
import { ExtraLesson } from "@/components/teacher/attendance/extra-lesson";
import { Badge } from "@/components/ui/badge";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isPresent } from "@/lib/attendance";
import {
  formatDate,
  isValidDateStr,
  toDbDate,
  todayInTashkent,
  weekdayLong,
  weekdayOf,
} from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Davomat" };

export default async function AttendancePage({
  searchParams,
}: PageProps<"/teacher/attendance">) {
  await requireTeacher();
  const today = todayInTashkent();
  const requested = (await searchParams).date;
  const date =
    typeof requested === "string" &&
    isValidDateStr(requested) &&
    requested <= today
      ? requested
      : today;
  const weekday = weekdayOf(date);

  const groups = await db.group.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      schedules: {
        where: { weekday },
        select: { startTime: true, endTime: true },
      },
      lessons: {
        where: { date: toDbDate(date) },
        select: { topic: true, attendances: { select: { status: true } } },
      },
      _count: {
        select: { students: { where: { role: "STUDENT", isActive: true } } },
      },
    },
  });

  // Jadval bo'yicha shu kuni darsi bor guruhlar + shu kunga qo'shimcha dars belgilanganlar
  const lessonsToday = groups
    .filter((g) => g.schedules.length > 0 || g.lessons.length > 0)
    .sort((a, b) =>
      (a.schedules[0]?.startTime ?? "99").localeCompare(
        b.schedules[0]?.startTime ?? "99",
      ),
    );
  const others = groups.filter((g) => !lessonsToday.includes(g));

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Davomat</h1>
          <p className="text-muted-foreground text-sm">
            {formatDate(date)}, {weekdayLong(weekday).toLowerCase()}
            {date === today && " (bugun)"}
          </p>
        </div>
        <AttendanceDatePicker date={date} max={today} />
      </div>

      {lessonsToday.length === 0 ? (
        <p className="text-muted-foreground">
          Bu kuni jadval bo&apos;yicha dars yo&apos;q.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lessonsToday.map((g) => {
            const lesson = g.lessons[0];
            const marked = lesson && lesson.attendances.length > 0;
            const present =
              lesson?.attendances.filter((a) => isPresent(a.status)).length ??
              0;
            const time = g.schedules[0];
            return (
              <li key={g.id}>
                <Link
                  href={`/teacher/attendance/${g.id}/${date}`}
                  className={cn(
                    "hover:bg-muted/50 flex h-full flex-col gap-2 rounded-lg border p-4 transition-colors",
                    !marked && "border-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{g.name}</span>
                    {time ? (
                      <span className="text-muted-foreground text-sm tabular-nums">
                        {time.startTime}–{time.endTime}
                      </span>
                    ) : (
                      <Badge variant="outline">Qo&apos;shimcha dars</Badge>
                    )}
                  </div>
                  {marked ? (
                    <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <CheckCircle2Icon className="text-primary size-4" />
                      Belgilangan: {present}/{lesson.attendances.length} keldi
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <CircleDashedIcon className="size-4" />
                      Belgilanmagan · {g._count.students} o&apos;quvchi
                    </span>
                  )}
                  {lesson?.topic && (
                    <span className="text-muted-foreground truncate text-sm">
                      {lesson.topic}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ExtraLesson
        date={date}
        groups={others.map((g) => ({ id: g.id, name: g.name }))}
      />
    </>
  );
}
