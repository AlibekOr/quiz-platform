import type { Metadata } from "next";
import { TestsListView } from "@/components/staff/tests/tests-list-view";
import { requireTeacher } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Testlar" };

// Umumiy ko'rinish: o'qituvchi va menejer (ruxsat va doira view ichida tekshiriladi)
export default async function Page({
  searchParams,
}: PageProps<"/teacher/tests">) {
  const user = await requireTeacher();
  const { new: openCreate } = await searchParams;
  return <TestsListView user={user} openCreate={openCreate === "1"} />;
}
