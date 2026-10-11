import type { Metadata } from "next";
import { AttendanceReportPage } from "@/components/attendance/attendance-report-page";
import { getAttendanceReportPage } from "@/lib/attendance-data";
import { requireManager } from "@/lib/auth/guards";
import { getScope } from "@/lib/auth/scope";

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
  const params = await searchParams;
  const data = await getAttendanceReportPage(await getScope(manager), {
    group: param(params.group),
    month: param(params.month),
  });

  return (
    <AttendanceReportPage
      data={data}
      emptyText="Sizga hali guruh biriktirilmagan."
      studentHref={null}
      lessonHref={null}
    />
  );
}
