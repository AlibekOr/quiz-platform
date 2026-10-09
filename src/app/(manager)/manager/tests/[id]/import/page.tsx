import type { Metadata } from "next";
import { TestImportView } from "@/components/staff/tests/test-import-view";
import { requireManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Savollarni import qilish" };

// Umumiy ko'rinish: o'qituvchi va menejer (ruxsat va doira view ichida tekshiriladi)
export default async function Page({
  params,
}: PageProps<"/manager/tests/[id]/import">) {
  const user = await requireManager();
  const { id } = await params;
  return <TestImportView user={user} id={id} />;
}
