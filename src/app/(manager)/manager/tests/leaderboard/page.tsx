import type { Metadata } from "next";
import { TestLeaderboardPage } from "@/components/leaderboard/test-leaderboard-page";
import { requireManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Test reytingi" };

// Testlar bo'limi: barcha testlardagi birinchi urinishlar yig'indisi bo'yicha reyting
export default async function TestsLeaderboardPage({
  searchParams,
}: PageProps<"/manager/tests/leaderboard">) {
  const user = await requireManager();
  return (
    <TestLeaderboardPage
      user={user}
      testId={null}
      searchParams={await searchParams}
      basePath="/manager/tests/leaderboard"
      back={{ href: "/manager/tests", label: "Testlar" }}
    />
  );
}
