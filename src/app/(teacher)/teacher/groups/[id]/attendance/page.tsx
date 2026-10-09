import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, DownloadIcon } from "lucide-react";
import { AttendanceReportView } from "@/components/teacher/attendance/attendance-report-view";
import { MonthPicker } from "@/components/teacher/attendance/month-picker";
import { buttonVariants } from "@/components/ui/button";
import { getAttendanceReport } from "@/lib/attendance-data";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  formatDate,
  formatSchedule,
  isValidMonthStr,
  monthRange,
  todayInTashkent,
} from "@/lib/time";

export const metadata: Metadata = { title: "Davomat hisoboti" };

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

      <AttendanceReportView
        report={report}
        studentHref={(sid) => `/teacher/students/${sid}`}
      />
    </>
  );
}
