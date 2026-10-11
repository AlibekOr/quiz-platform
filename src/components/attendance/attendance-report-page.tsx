import { DownloadIcon } from "lucide-react";
import { ParamSelect } from "@/components/common/param-select";
import { buttonVariants } from "@/components/ui/button";
import type { getAttendanceReportPage } from "@/lib/attendance-data";
import { formatDate, formatSchedule, type DateStr } from "@/lib/time";
import { AttendanceReportView } from "./attendance-report-view";
import { MonthPicker } from "./month-picker";

type ReportPageData = Awaited<ReturnType<typeof getAttendanceReportPage>>;

/**
 * Davomat hisoboti sahifasi (o'qituvchi va menejer bir xil): guruh va oy tanlash, Excel,
 * davr ma'lumoti, jadval. lessonHref — faqat o'qituvchi (sanadan davomat yuritishga)
 */
export function AttendanceReportPage({
  data,
  emptyText,
  studentHref,
  lessonHref,
}: {
  data: ReportPageData;
  emptyText: string;
  studentHref: ((id: string) => string) | null;
  lessonHref: ((groupId: string, date: DateStr) => string) | null;
}) {
  const { groups, group, report, month, currentMonth, from, to } = data;

  return (
    <>
      <h1 className="text-2xl font-semibold">Davomat hisoboti</h1>
      {!group || !report ? (
        <p className="text-muted-foreground">{emptyText}</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ParamSelect
              name="group"
              value={group.id}
              label="Guruh"
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
            />
            <MonthPicker month={month} max={currentMonth} />
            <a
              href={`/api/attendance/export?groupId=${group.id}&from=${from}&to=${to}`}
              className={buttonVariants({ variant: "outline" })}
            >
              <DownloadIcon />
              Excel
            </a>
          </div>
          <p className="text-muted-foreground text-sm">
            {group.name} · {formatSchedule(group.schedules) || "jadval yo'q"} ·{" "}
            {formatDate(from)} – {formatDate(to)}
          </p>
          <AttendanceReportView
            report={report}
            studentHref={studentHref}
            lessonHref={
              lessonHref ? (date) => lessonHref(group.id, date) : null
            }
          />
        </>
      )}
    </>
  );
}
