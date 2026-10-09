import type { Metadata } from "next";
import { TestsListView } from "@/components/staff/tests/tests-list-view";
import { requireManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Testlar" };

// Umumiy ko'rinish: o'qituvchi va menejer (ruxsat va doira view ichida tekshiriladi)
export default async function Page() {
  const user = await requireManager();
  return <TestsListView user={user} />;
}
