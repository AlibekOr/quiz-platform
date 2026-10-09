import type { Metadata } from "next";
import { AttemptView } from "@/components/staff/tests/attempt-view";
import { requireManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Urinish" };

// Umumiy ko'rinish: o'qituvchi va menejer (ruxsat va doira view ichida tekshiriladi)
export default async function Page({
  params,
}: PageProps<"/manager/tests/[id]/results/[attemptId]">) {
  const user = await requireManager();
  const { id, attemptId } = await params;
  return <AttemptView user={user} testId={id} attemptId={attemptId} />;
}
