import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TestLeaderboardPage } from "@/components/leaderboard/test-leaderboard-page";
import { requireRole } from "@/lib/auth/guards";
import { staffBase } from "@/lib/tests/access";

export const metadata: Metadata = { title: "Test reytingi" };

// O'quvchi: bitta test reytingi. Xodim o'z Testlar bo'limidagi sahifaga yo'naltiriladi
export default async function TestLeaderboardPage_({
  params,
  searchParams,
}: PageProps<"/test/[id]/leaderboard">) {
  const user = await requireRole(["TEACHER", "MANAGER", "STUDENT"]);
  const { id } = await params;
  if (user.role !== "STUDENT")
    redirect(`${staffBase(user.role)}/tests/${id}/leaderboard`);
  return (
    <TestLeaderboardPage
      user={user}
      testId={id}
      searchParams={await searchParams}
      basePath={`/test/${id}/leaderboard`}
      back={{ href: "/dashboard", label: "Bosh sahifa" }}
    />
  );
}
