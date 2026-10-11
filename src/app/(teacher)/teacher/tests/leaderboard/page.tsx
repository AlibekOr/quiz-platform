import type { Metadata } from "next";
import { TestLeaderboardPage } from "@/components/leaderboard/test-leaderboard-page";
import { requireTeacher } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Test reytingi" };

// Testlar bo'limi: barcha testlardagi birinchi urinishlar yig'indisi bo'yicha reyting
export default async function TestsLeaderboardPage({
  searchParams,
}: PageProps<"/teacher/tests/leaderboard">) {
  const user = await requireTeacher();
  return (
    <TestLeaderboardPage
      user={user}
      testId={null}
      searchParams={await searchParams}
      basePath="/teacher/tests/leaderboard"
      back={{ href: "/teacher/tests", label: "Testlar" }}
    />
  );
}
