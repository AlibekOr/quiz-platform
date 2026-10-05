import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { resolveLeaderboard } from "@/lib/leaderboard-access";

export const metadata: Metadata = { title: "Reyting" };

function one(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export default async function LeaderboardPage({
  searchParams,
}: PageProps<"/leaderboard">) {
  const user = await requireUser();
  const params = await searchParams;
  const data = await resolveLeaderboard(user, {
    scope: one(params.scope),
    groupId: one(params.groupId),
  });
  if ("error" in data) notFound();

  const isTeacher = user.role === "TEACHER";
  const groups = isTeacher
    ? await db.group.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Umumiy reyting</h1>
        <p className="text-muted-foreground text-sm">
          Barcha testlardagi birinchi urinish ballari yig&apos;indisi
        </p>
      </div>
      <LeaderboardView
        data={data}
        basePath="/leaderboard"
        isTeacher={isTeacher}
        groups={groups}
      />
    </>
  );
}
