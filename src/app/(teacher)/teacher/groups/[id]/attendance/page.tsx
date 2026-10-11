import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth/guards";

// Eski manzil: guruh oldindan tanlangan umumiy davomat hisobotiga yo'naltiriladi
export default async function GroupAttendanceRedirect({
  params,
  searchParams,
}: PageProps<"/teacher/groups/[id]/attendance">) {
  await requireTeacher();
  const { id } = await params;
  const { month } = await searchParams;
  const query = new URLSearchParams({ group: id });
  if (typeof month === "string") query.set("month", month);
  redirect(`/teacher/attendance/report?${query}`);
}
