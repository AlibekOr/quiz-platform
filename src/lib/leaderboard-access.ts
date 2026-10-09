import "server-only";
import type { CurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  getOverallLeaderboard,
  getTestLeaderboard,
  type Leaderboard,
} from "@/lib/leaderboard";
import { leaderboardQuerySchema } from "@/lib/validators/leaderboard";

export type LeaderboardScope = "group" | "all";

export type ResolvedLeaderboard = {
  scope: LeaderboardScope;
  /** "Mening guruhim"/tanlangan guruh; scope=all bo'lsa null */
  group: { id: string; name: string } | null;
  test: { id: string; title: string } | null;
  board: Leaderboard;
};

export type LeaderboardError = { error: string; status: 400 | 403 | 404 };

const EMPTY: Leaderboard = { entries: [], me: null, total: 0 };

/**
 * Reyting so'rovini tekshiradi va bajaradi (API va sahifalar uchun umumiy).
 * O'quvchi: "group" doim uning BAZADAGI guruhi — URL'dagi groupId e'tiborga olinmaydi.
 * O'qituvchi: istalgan guruhni groupId bilan tanlaydi (berilmasa — birinchi guruh).
 */
export async function resolveLeaderboard(
  user: CurrentUser,
  params: {
    testId?: string | null;
    scope?: string | null;
    groupId?: string | null;
  },
): Promise<ResolvedLeaderboard | LeaderboardError> {
  // Menejerga reyting hozircha yopiq (14-bosqichda doirasi bilan ochiladi)
  if (user.role !== "TEACHER" && user.role !== "STUDENT")
    return { error: "Ruxsat yo'q", status: 403 };
  const query = leaderboardQuerySchema.parse(params);
  const scope: LeaderboardScope = query.scope;
  const isTeacher = user.role === "TEACHER";

  let test: ResolvedLeaderboard["test"] = null;
  if (query.testId) {
    const found = await db.test.findUnique({
      where: { id: query.testId },
      select: { id: true, title: true, groups: { select: { id: true } } },
    });
    if (!found) return { error: "Test topilmadi", status: 404 };
    if (!isTeacher) {
      const assigned =
        user.groupId !== null &&
        found.groups.some((g) => g.id === user.groupId);
      const attempted =
        assigned ||
        (await db.attempt.count({
          where: { testId: found.id, userId: user.id },
        })) > 0;
      if (!attempted)
        return { error: "Bu test reytingini ko'rib bo'lmaydi", status: 403 };
    }
    test = { id: found.id, title: found.title };
  }

  let group: ResolvedLeaderboard["group"] = null;
  if (scope === "group") {
    const groupId = isTeacher ? (query.groupId ?? null) : user.groupId;
    group = groupId
      ? await db.group.findUnique({
          where: { id: groupId },
          select: { id: true, name: true },
        })
      : isTeacher
        ? await db.group.findFirst({
            orderBy: { name: "asc" },
            select: { id: true, name: true },
          })
        : null;
    if (isTeacher && groupId && !group)
      return { error: "Guruh topilmadi", status: 404 };
    // Guruhsiz o'quvchi uchun "Mening guruhim" bo'sh
    if (!group) return { scope, group: null, test, board: EMPTY };
  }

  const filter = {
    groupId: group?.id ?? null,
    userId: isTeacher ? null : user.id,
  };
  const board = test
    ? await getTestLeaderboard(test.id, filter)
    : await getOverallLeaderboard(filter);
  return { scope, group, test, board };
}
