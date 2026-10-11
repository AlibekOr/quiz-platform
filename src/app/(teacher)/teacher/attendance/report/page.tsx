import type { Metadata } from "next";
import { AttendanceReportPage } from "@/components/attendance/attendance-report-page";
import { getAttendanceReportPage } from "@/lib/attendance-data";
import { requireTeacher } from "@/lib/auth/guards";
import { getScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Davomat hisoboti" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// O'qituvchi: barcha guruhlar. Sana sarlavhasi o'sha darsning davomat yuritish sahifasini ochadi
export default async function TeacherAttendanceReportPage({
  searchParams,
}: PageProps<"/teacher/attendance/report">) {
  const teacher = await requireTeacher();
  const params = await searchParams;
  const data = await getAttendanceReportPage(await getScope(teacher), {
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
