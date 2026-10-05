import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, DownloadIcon, TriangleAlertIcon } from "lucide-react";
import { MonthPicker } from "@/components/teacher/attendance/month-picker";
import { buttonVariants } from "@/components/ui/button";
import {
  isPresent,
  MARK_LABEL,
  MARK_SYMBOL,
  mostAbsent,
} from "@/lib/attendance";
import { getAttendanceReport } from "@/lib/attendance-data";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  formatDate,
  formatDayMonth,
  formatSchedule,
  isValidMonthStr,
  monthRange,
  todayInTashkent,
} from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Davomat hisoboti" };

const CELL_CLASS = {
  PRESENT: "",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  LATE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
} as const;

export default async function GroupAttendanceReportPage({
  params,
  searchParams,
}: PageProps<"/teacher/groups/[id]/attendance">) {
  await requireTeacher();
  const { id } = await params;
  const currentMonth = todayInTashkent().slice(0, 7);
  const requested = (await searchParams).month;
  const month =
    typeof requested === "string" && isValidMonthStr(requested)
      ? requested
      : currentMonth;
  const { from, to } = monthRange(month);

  const group = await db.group.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      schedules: { select: { weekday: true, startTime: true, endTime: true } },
    },
  });
  if (!group) notFound();

  const report = await getAttendanceReport(group.id, from, to);
  const worst = mostAbsent(report);
  // Guruh ko'rsatkichlari faqat shu guruh darslari bo'yicha (oldingi guruh yozuvlarisiz)
  const ownMarks = report.students.flatMap((s) =>
    s.cells.flatMap((c) => (c && !c.fromGroup ? [c.status] : [])),
  );
  const totalMarks = ownMarks.length;
  const totalPresent = ownMarks.filter(isPresent).length;
  const ownLessons = report.foreignOnly.filter((only) => !only).length;
  const hasForeign = report.students.some((s) =>
    s.cells.some((c) => c?.fromGroup),
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={`/teacher/groups/${group.id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          {group.name}
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Davomat hisoboti</h1>
            <p className="text-muted-foreground text-sm">
              {group.name} · {formatSchedule(group.schedules) || "jadval yo'q"}{" "}
              · {formatDate(from)} – {formatDate(to)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <MonthPicker month={month} max={currentMonth} />
            <a
              href={`/api/attendance/export?groupId=${group.id}&from=${from}&to=${to}`}
              className={buttonVariants({ variant: "outline" })}
            >
              <DownloadIcon />
              Excel
            </a>
          </div>
        </div>
      </div>

      {report.dates.length === 0 ? (
        <p className="text-muted-foreground">Bu oyda davomat belgilanmagan.</p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Darslar: {ownLessons} · O&apos;rtacha davomat:{" "}
            <b className="text-foreground">
              {totalMarks ? Math.round((totalPresent / totalMarks) * 100) : 0}%
            </b>
          </p>

          {worst.length > 0 && (
            <section className="flex flex-col gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <TriangleAlertIcon className="size-4 text-amber-600" />
                Eng ko&apos;p dars qoldirganlar
              </h2>
              <ul className="flex flex-col gap-1 text-sm">
                {worst.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    <Link
                      href={`/teacher/students/${s.id}`}
                      className="hover:underline"
                    >
                      {s.fullName}
                    </Link>
                    <span className="tabular-nums">
                      {s.stats.absent} ta qoldirgan · {s.stats.percent}%
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="bg-muted sticky left-0 z-10 px-3 py-2 text-left font-medium">
                    O&apos;quvchi
                  </th>
                  {report.dates.map((d, j) => (
                    <th
                      key={d}
                      title={
                        report.foreignOnly[j]
                          ? "Faqat oldingi guruhdagi darslar"
                          : undefined
                      }
                      className={cn(
                        "px-1.5 py-2 text-center font-medium tabular-nums",
                        report.foreignOnly[j] &&
                          "text-muted-foreground font-normal italic",
                      )}
                    >
                      {formatDayMonth(d)}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-right font-medium">Keldi</th>
                  <th className="px-2 py-2 text-right font-medium">Kelmadi</th>
                  <th className="px-3 py-2 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {report.students.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="bg-background sticky left-0 z-10 px-3 py-1.5 whitespace-nowrap">
                      <Link
                        href={`/teacher/students/${s.id}`}
                        className="hover:underline"
                      >
                        {s.fullName}
                      </Link>
                    </td>
                    {s.cells.map((c, j) => (
                      <td
                        key={report.dates[j]}
                        title={
                          c
                            ? `${c.fromGroup ? `Oldingi guruh: ${c.fromGroup} · ` : ""}${MARK_LABEL[c.status]}${c.note ? `: ${c.note}` : ""}`
                            : undefined
                        }
                        className={cn(
                          "px-1.5 py-1.5 text-center font-medium",
                          c &&
                            (c.fromGroup
                              ? "text-muted-foreground font-normal italic"
                              : CELL_CLASS[c.status]),
                        )}
                      >
                        {c ? MARK_SYMBOL[c.status] : ""}
                        {c?.note && <sup aria-hidden>*</sup>}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {s.stats.present}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {s.stats.absent}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-1.5 text-right font-medium tabular-nums",
                        s.stats.percent !== null &&
                          s.stats.percent < 70 &&
                          "text-destructive",
                      )}
                    >
                      {s.stats.percent === null ? "—" : `${s.stats.percent}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-medium">
                  <td className="bg-muted sticky left-0 z-10 px-3 py-2">
                    Kelganlar
                  </td>
                  {report.presentPerLesson.map((n, j) => (
                    <td
                      key={report.dates[j]}
                      className="px-1.5 py-2 text-center tabular-nums"
                    >
                      {report.foreignOnly[j] ? "" : n}
                    </td>
                  ))}
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-muted-foreground text-xs">
            + keldi · − kelmadi · K kechikdi (keldi hisoblanadi) · * izoh bor
            (ustiga olib boring)
            {hasForeign &&
              " · kulrang — o'quvchining oldingi guruhidagi darslar (foizga kiradi)"}
          </p>
        </>
      )}
    </>
  );
}
