import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import type { CurrentUser } from "@/lib/auth/guards";
import { getScope, groupScopeWhere } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { resolveLeaderboard } from "@/lib/leaderboard-access";
import { LeaderboardView } from "./leaderboard-view";

function one(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

/**
 * Testlar bo'limidagi reyting (o'qituvchi, menejer va o'quvchi route'lari umumiy):
 * testId bo'lsa — bitta test, aks holda barcha testlar yig'indisi.
 * Chaqiruvchi route avval require*() qiladi
 */
export async function TestLeaderboardPage({
  user,
  testId,
  searchParams,
  basePath,
  back,
}: {
  user: CurrentUser;
  testId: string | null;
  searchParams: Record<string, string | string[] | undefined>;
  basePath: string;
  back: { href: string; label: string };
}) {
  const data = await resolveLeaderboard(user, {
    testId,
    board: "tests",
    scope: one(searchParams.scope),
    groupId: one(searchParams.groupId),
  });
  // Ruxsat yo'q yoki test yo'q — mavjudligi oshkor qilinmaydi
  if ("error" in data || data.kind === "semester") notFound();

  // O'qituvchi va menejer guruhni tanlaydi (menejer — faqat doiradagilar)
  const isStaff = user.role !== "STUDENT";
  const groups = isStaff
    ? await db.group.findMany({
        where: groupScopeWhere(await getScope(user)),
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={back.href}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          {back.label}
        </Link>
        <div>
          <p className="text-muted-foreground text-sm">Test reytingi</p>
          <h1 className="text-2xl font-semibold break-words">
            {data.kind === "test" ? data.test.title : "Barcha testlar"}
          </h1>
        </div>
      </div>
      <LeaderboardView
        data={data}
        basePath={basePath}
        isTeacher={isStaff}
        groups={groups}
      />
    </>
  );
}
