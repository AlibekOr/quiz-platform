import "server-only";
import { db } from "@/lib/db";
import { rankByTotal } from "@/lib/grades";
import { currentSemesterId, getSemesterGrades } from "@/lib/grades-data";
import { LEADERBOARD_LIMIT } from "@/lib/leaderboard";
import { todayInTashkent } from "@/lib/time";

// Bosh reyting (TASKS.md, 6-bo'lim): joriy semestrdagi jami ball (testlar kirmaydi).
// Har guruh o'zining joriy semestri bo'yicha; faqat hozirgi a'zolar, faol va arxivlanmaganlar.
// Boshqa o'quvchilarning kategoriyalari va jarimalari yuborilmaydi — faqat jami

export type SemesterLeaderboardEntry = {
  userId: string;
  fullName: string;
  groupName: string;
  rank: number;
  total: number;
  maxTotal: number;
};

export type SemesterLeaderboard = {
  entries: SemesterLeaderboardEntry[];
  /** Joriy o'quvchining qatori (top N da bo'lmasa ham); xodim uchun null */
  me: SemesterLeaderboardEntry | null;
  total: number;
};

type Filter = {
  /** Bitta guruh ("Mening guruhim" / tanlangan guruh); null — hamma (yoki groupIds) */
  groupId: string | null;
  /** Menejer doirasi: faqat shu guruhlar (null — cheklovsiz) */
  groupIds?: readonly string[] | null;
  userId?: string | null;
  limit?: number;
};

async function targetGroups(
  filter: Filter,
): Promise<{ id: string; name: string }[]> {
  if (filter.groupId) {
    if (filter.groupIds && !filter.groupIds.includes(filter.groupId)) return [];
    return db.group.findMany({
      where: { id: filter.groupId },
      select: { id: true, name: true },
    });
  }
  return db.group.findMany({
    where: filter.groupIds ? { id: { in: [...filter.groupIds] } } : {},
    select: { id: true, name: true },
  });
}

export async function getSemesterLeaderboard(
  filter: Filter,
): Promise<SemesterLeaderboard> {
  const limit = filter.limit ?? LEADERBOARD_LIMIT;
  const today = todayInTashkent();
  const groups = await targetGroups(filter);

  const perGroup = await Promise.all(
    groups.map(async (g) => {
      const semesterId = await currentSemesterId(g.id, today);
      const data = semesterId ? await getSemesterGrades(semesterId) : null;
      return (data?.students ?? [])
        .filter((s) => s.departure === null)
        .map((s) => ({
          userId: s.id,
          fullName: s.fullName,
          groupName: g.name,
          total: s.result.total,
          maxTotal: s.result.maxTotal,
        }));
    }),
  );
  const rows = perGroup.flat();

  // Bloklangan o'quvchilar reytingda chiqmaydi (arxivlanganlar getSemesterGrades'da yo'q)
  const active = new Set(
    (
      await db.user.findMany({
        where: {
          id: { in: rows.map((r) => r.userId) },
          isActive: true,
          archivedAt: null,
        },
        select: { id: true },
      })
    ).map((u) => u.id),
  );
  const ranked = rankByTotal(rows.filter((r) => active.has(r.userId)));
  const me = filter.userId
    ? (ranked.find((r) => r.userId === filter.userId) ?? null)
    : null;
  return {
    entries: ranked.filter((r) => r.rank <= limit),
    me,
    total: ranked.length,
  };
}
