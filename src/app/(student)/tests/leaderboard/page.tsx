import type { Metadata } from "next";
import { TestLeaderboardPage } from "@/components/leaderboard/test-leaderboard-page";
import { requireStudent } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Test reytingi" };

// O'quvchi: barcha testlar bo'yicha reyting (guruhi sessiyadan)
export default async function StudentTestsLeaderboardPage({
  searchParams,
}: PageProps<"/tests/leaderboard">) {
  const user = await requireStudent();
  return (
    <TestLeaderboardPage
      user={user}
      testId={null}
      searchParams={await searchParams}
      basePath="/tests/leaderboard"
      back={{ href: "/dashboard", label: "Bosh sahifa" }}
    />
  );
}
