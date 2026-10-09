import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { requireRole } from "@/lib/auth/guards";
import { getScope, groupScopeWhere } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { resolveLeaderboard } from "@/lib/leaderboard-access";

export const metadata: Metadata = { title: "Test reytingi" };

function one(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export default async function TestLeaderboardPage({
  params,
  searchParams,
}: PageProps<"/test/[id]/leaderboard">) {
  const user = await requireRole(["TEACHER", "MANAGER", "STUDENT"]);
  const { id } = await params;
  const query = await searchParams;
  const data = await resolveLeaderboard(user, {
    testId: id,
    scope: one(query.scope),
    groupId: one(query.groupId),
  });
  // Ruxsat yo'q yoki test yo'q — mavjudligi oshkor qilinmaydi
  if ("error" in data || !data.test) notFound();

  // O'qituvchi va menejer guruhni tanlaydi (menejer — faqat doiradagilar)
  const isTeacher = user.role !== "STUDENT";
  const groups = isTeacher
    ? await db.group.findMany({
        where: groupScopeWhere(await getScope(user)),
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];

  return (
    <>
      <div>
        <p className="text-muted-foreground text-sm">Test reytingi</p>
        <h1 className="text-2xl font-semibold break-words">
          {data.test.title}
        </h1>
      </div>
      <LeaderboardView
        data={data}
        basePath={`/test/${id}/leaderboard`}
        isTeacher={isTeacher}
        groups={groups}
      />
    </>
  );
}
