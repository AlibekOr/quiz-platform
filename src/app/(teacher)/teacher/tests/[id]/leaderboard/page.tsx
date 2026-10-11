import type { Metadata } from "next";
import { TestLeaderboardPage } from "@/components/leaderboard/test-leaderboard-page";
import { requireTeacher } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Test reytingi" };

// Testlar bo'limi: bitta test reytingi (barcha guruhlar)
export default async function TestLeaderboardRoute({
  params,
  searchParams,
}: PageProps<"/teacher/tests/[id]/leaderboard">) {
  const user = await requireTeacher();
  const { id } = await params;
  return (
    <TestLeaderboardPage
      user={user}
      testId={id}
      searchParams={await searchParams}
      basePath={`/teacher/tests/${id}/leaderboard`}
      back={{ href: `/teacher/tests/${id}/results`, label: "Natijalar" }}
    />
  );
}
