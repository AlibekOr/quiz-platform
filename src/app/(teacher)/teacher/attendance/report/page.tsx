import type { Metadata } from "next";
import { AttendanceReportPage } from "@/components/attendance/attendance-report-page";
import { getAttendanceReportPage } from "@/lib/attendance-data";
import { requireTeacherScope } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Davomat hisoboti" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// O'qituvchi: barcha guruhlar. Sana sarlavhasi o'sha darsning davomat yuritish sahifasini ochadi
export default async function TeacherAttendanceReportPage({
  searchParams,
}: PageProps<"/teacher/attendance/report">) {
  const { scope } = await requireTeacherScope();
  const params = await searchParams;
  const data = await getAttendanceReportPage(scope, {
    group: param(params.group),
    month: param(params.month),
  });

  return (
    <AttendanceReportPage
      data={data}
      emptyText="Hali guruh yo'q."
      studentHref={(id) => `/teacher/students/${id}`}
      lessonHref={(groupId, date) => `/teacher/attendance/${groupId}/${date}`}
    />
  );
}
