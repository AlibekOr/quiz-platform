import type { Metadata } from "next";
import { TestCopyView } from "@/components/staff/tests/test-copy-view";
import { requireManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Boshqa testdan savol qo'shish" };

// Umumiy ko'rinish: o'qituvchi va menejer (ruxsat va doira view ichida tekshiriladi)
export default async function Page({
  params,
  searchParams,
}: PageProps<"/manager/tests/[id]/copy">) {
  const user = await requireManager();
  const { id } = await params;
  const { from } = await searchParams;
  return (
    <TestCopyView
      user={user}
      id={id}
      from={typeof from === "string" ? from : null}
    />
  );
}
