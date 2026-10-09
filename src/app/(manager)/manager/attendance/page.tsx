import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";
import { ParamSelect } from "@/components/common/param-select";
import { AttendanceReportView } from "@/components/teacher/attendance/attendance-report-view";
import { MonthPicker } from "@/components/teacher/attendance/month-picker";
import { buttonVariants } from "@/components/ui/button";
import { getAttendanceReport } from "@/lib/attendance-data";
import { requireManager } from "@/lib/auth/guards";
import { getScope, groupScopeWhere } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import {
  formatDate,
  formatSchedule,
  isValidMonthStr,
  monthRange,
  todayInTashkent,
} from "@/lib/time";

export const metadata: Metadata = { title: "Davomat" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// Menejer: doiradagi guruhlarning davomat hisobotlari va Excel. Faqat ko'rish —
// davomat belgilash o'qituvchida
export default async function ManagerAttendancePage({
  searchParams,
}: PageProps<"/manager/attendance">) {
  const manager = await requireManager();
  const scope = await getScope(manager);
  const params = await searchParams;
  const currentMonth = todayInTashkent().slice(0, 7);
  const requested = param(params.month);
  const month = isValidMonthStr(requested) ? requested : currentMonth;
  const { from, to } = monthRange(month);

  const groups = await db.group.findMany({
    where: groupScopeWhere(scope),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      schedules: { select: { weekday: true, startTime: true, endTime: true } },
    },
  });
  // Doiradan tashqaridagi groupId e'tiborsiz qoldiriladi — birinchi guruh ko'rsatiladi
  const group =
    groups.find((g) => g.id === param(params.group)) ?? groups[0] ?? null;
  const report = group ? await getAttendanceReport(group.id, from, to) : null;

  return (
    <>
      <h1 className="text-2xl font-semibold">Davomat</h1>
      {!group || !report ? (
        <p className="text-muted-foreground">
          Sizga hali guruh biriktirilmagan.
        </p>
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
          <AttendanceReportView report={report} studentHref={null} />
        </>
      )}
    </>
  );
}
