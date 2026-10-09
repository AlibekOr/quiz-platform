import type { Metadata } from "next";
import { TestEditView } from "@/components/staff/tests/test-edit-view";
import { requireManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Testni tahrirlash" };

// Umumiy ko'rinish: o'qituvchi va menejer (ruxsat va doira view ichida tekshiriladi)
export default async function Page({
  params,
}: PageProps<"/manager/tests/[id]">) {
  const user = await requireManager();
  const { id } = await params;
  return <TestEditView user={user} id={id} />;
}
