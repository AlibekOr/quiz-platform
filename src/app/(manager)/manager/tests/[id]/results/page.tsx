import type { Metadata } from "next";
import { TestResultsView } from "@/components/staff/tests/test-results-view";
import { requireManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Test natijalari" };

// Umumiy ko'rinish: o'qituvchi va menejer (ruxsat va doira view ichida tekshiriladi)
export default async function Page({
  params,
  searchParams,
}: PageProps<"/manager/tests/[id]/results">) {
  const user = await requireManager();
  const { id } = await params;
  return (
    <TestResultsView user={user} id={id} searchParams={await searchParams} />
  );
}
