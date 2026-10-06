import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2Icon,
  CircleDashedIcon,
  ClipboardListIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireTeacher } from "@/lib/auth/guards";
import { isPresent } from "@/lib/attendance";
import { db } from "@/lib/db";
import { percent } from "@/lib/format";
import {
  addDays,
  formatDate,
  formatDateTime,
  toDbDate,
  todayInTashkent,
  weekdayLong,
  weekdayOf,
} from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "O'qituvchi paneli" };

const RECENT_RESULTS = 8;
const ABSENT_DAYS = 30;
const ABSENT_LIMIT = 5;

export default async function TeacherPage() {
  await requireTeacher();
  const today = todayInTashkent();
  const weekday = weekdayOf(today);
  const absentFrom = addDays(today, -(ABSENT_DAYS - 1));

  const [studentCount, groupCount, activeTestCount, groups, recent, misses] =
    await Promise.all([
      db.user.count({
        where: { role: "STUDENT", isActive: true, archivedAt: null },
      }),
      db.group.count(),
      db.test.count({ where: { isActive: true } }),
      db.group.findMany({
        where: {
          OR: [
            { schedules: { some: { weekday } } },
            { lessons: { some: { date: toDbDate(today) } } },
          ],
        },
        select: {
          id: true,
          name: true,
          schedules: {
            where: { weekday },
            select: { startTime: true, endTime: true },
          },
          lessons: {
            where: { date: toDbDate(today) },
            select: { attendances: { select: { status: true } } },
          },
          _count: {
            select: {
              students: {
                where: { role: "STUDENT", isActive: true, archivedAt: null },
              },
            },
          },
        },
      }),
      db.attempt.findMany({
        where: {
          status: { in: ["FINISHED", "EXPIRED"] },
          user: { archivedAt: null },
        },
        orderBy: { finishedAt: "desc" },
        take: RECENT_RESULTS,
        select: {
          id: true,
          testId: true,
          score: true,
          maxScore: true,
          finishedAt: true,
          user: {
            select: { fullName: true, group: { select: { name: true } } },
          },
          test: { select: { title: true } },
        },
      }),
      db.attendance.findMany({
        where: {
          status: { in: ["ABSENT", "LATE"] },
          lesson: { date: { gte: toDbDate(absentFrom), lte: toDbDate(today) } },
          student: { role: "STUDENT", isActive: true, archivedAt: null },
        },
        select: {
          status: true,
          student: {
            select: {
              id: true,
              fullName: true,
              group: { select: { name: true } },
            },
          },
        },
      }),
    ]);

  const lessonsToday = groups.sort((a, b) =>
    (a.schedules[0]?.startTime ?? "99").localeCompare(
      b.schedules[0]?.startTime ?? "99",
    ),
  );

  const missByStudent = new Map<
    string,
    {
      id: string;
      fullName: string;
      group: string | null;
      absent: number;
      late: number;
    }
  >();
  for (const m of misses) {
    const row = missByStudent.get(m.student.id) ?? {
      id: m.student.id,
      fullName: m.student.fullName,
      group: m.student.group?.name ?? null,
      absent: 0,
      late: 0,
    };
    if (m.status === "ABSENT") row.absent++;
    else row.late++;
    missByStudent.set(m.student.id, row);
  }
  const topMisses = [...missByStudent.values()]
    .sort(
      (a, b) =>
        b.absent - a.absent ||
        b.late - a.late ||
        a.fullName.localeCompare(b.fullName, "uz"),
    )
    .slice(0, ABSENT_LIMIT);

  const stats = [
    {
      label: "O'quvchilar",
      value: studentCount,
      href: "/teacher/students",
      icon: UsersIcon,
    },
    {
      label: "Guruhlar",
      value: groupCount,
      href: "/teacher/groups",
      icon: UsersRoundIcon,
    },
    {
      label: "Faol testlar",
      value: activeTestCount,
      href: "/teacher/tests",
      icon: ClipboardListIcon,
    },
  ];

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Bosh sahifa</h1>
        <p className="text-muted-foreground text-sm">
          {formatDate(today)}, {weekdayLong(weekday).toLowerCase()}
        </p>
      </div>

      <ul className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="hover:bg-muted/50 flex h-full flex-col gap-1 rounded-lg border p-3 transition-colors sm:p-4"
            >
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs sm:text-sm">
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label}</span>
              </span>
              <span className="text-2xl font-semibold tabular-nums">
                {value}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-semibold">Bugungi darslar</h2>
          <Link
            href="/teacher/attendance"
            className="text-muted-foreground text-sm hover:underline"
          >
            Davomat
          </Link>
        </div>
        {lessonsToday.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Bugun jadval bo&apos;yicha dars yo&apos;q.
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
                    href={`/teacher/attendance/${g.id}/${today}`}
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
                        Davomatni belgilash · {g._count.students} o&apos;quvchi
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Oxirgi natijalar</h2>
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Hali hech kim test topshirmagan.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/teacher/tests/${a.testId}/results/${a.id}`}
                    className="hover:bg-muted/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {a.user.fullName}
                      </span>
                      <span className="text-muted-foreground truncate text-sm">
                        {a.test.title}
                        {a.user.group && ` · ${a.user.group.name}`}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="font-semibold tabular-nums">
                        {a.score ?? 0}/{a.maxScore ?? 0}
                        <span className="text-muted-foreground ml-1 text-sm font-normal">
                          ({percent(a.score ?? 0, a.maxScore ?? 0)}%)
                        </span>
                      </span>
                      {a.finishedAt && (
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {formatDateTime(a.finishedAt)}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="font-semibold">Ko&apos;p dars qoldirganlar</h2>
            <p className="text-muted-foreground text-sm">
              Oxirgi {ABSENT_DAYS} kun
            </p>
          </div>
          {topMisses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Bu davrda dars qoldirganlar yo&apos;q.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {topMisses.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/teacher/students/${s.id}`}
                    className="hover:bg-muted/50 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{s.fullName}</span>
                      {s.group && (
                        <span className="text-muted-foreground truncate text-sm">
                          {s.group}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end text-sm">
                      <span className="font-medium">{s.absent} kelmadi</span>
                      {s.late > 0 && (
                        <span className="text-muted-foreground">
                          {s.late} kechikdi
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
