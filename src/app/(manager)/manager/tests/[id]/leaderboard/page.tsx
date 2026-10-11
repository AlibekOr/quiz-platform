import type { Metadata } from "next";
import { TestLeaderboardPage } from "@/components/leaderboard/test-leaderboard-page";
import { requireManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Test reytingi" };

// Testlar bo'limi: bitta test reytingi (menejer — faqat doiradagi o'quvchilar)
export default async function TestLeaderboardRoute({
  params,
  searchParams,
}: PageProps<"/manager/tests/[id]/leaderboard">) {
  const user = await requireManager();
  const { id } = await params;
  return (
    <TestLeaderboardPage
      user={user}
      testId={id}
      searchParams={await searchParams}
      basePath={`/manager/tests/${id}/leaderboard`}
      back={{ href: `/manager/tests/${id}/results`, label: "Natijalar" }}
    />
  );
}
