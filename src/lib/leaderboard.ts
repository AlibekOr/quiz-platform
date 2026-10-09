import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { db } from "@/lib/db";

// Reyting (PLAN.md, "Reyting"): faqat isFirst = true va FINISHED/EXPIRED attemptlar,
// faol o'quvchilar. Tartib: score DESC, durationSec ASC; o'rin RANK() bilan.

export const LEADERBOARD_LIMIT = 50;

export type LeaderboardEntry = {
  userId: string;
  fullName: string;
  groupName: string | null;
  rank: number;
  score: number;
  durationSec: number;
  /** Umumiy reytingda: nechta test hisobga olingan */
  tests: number;
};

export type Leaderboard = {
  entries: LeaderboardEntry[];
  /** Joriy o'quvchining qatori (top 50 da bo'lmasa ham); o'qituvchi uchun null */
  me: LeaderboardEntry | null;
  total: number;
};

type Filter = {
  /** null — barcha guruhlar */
  groupId: string | null;
  /** Menejer doirasi: faqat shu guruhlardagi o'quvchilar (null — cheklovsiz) */
  groupIds?: readonly string[] | null;
  /** Joriy o'quvchi (me qatori uchun) */
  userId?: string | null;
  limit?: number;
};

type Row = Omit<LeaderboardEntry, "groupName"> & {
  groupName: string | null;
  total: number;
};

function groupFilter(filter: Filter) {
  const one =
    filter.groupId === null
      ? Prisma.empty
      : Prisma.sql`AND u."groupId" = ${filter.groupId}`;
  if (!filter.groupIds) return one;
  // Bo'sh doira — hech kim (ANY('{}') hech narsaga mos kelmaydi)
  return Prisma.sql`${one} AND u."groupId" = ANY(${[...filter.groupIds]}::text[])`;
}

function toEntry(r: Row): LeaderboardEntry {
  return {
    userId: r.userId,
    fullName: r.fullName,
    groupName: r.groupName,
    rank: r.rank,
    score: r.score,
    durationSec: r.durationSec,
    tests: r.tests,
  };
}

/** Top `limit` o'rin (50-o'rinda teng natijalar bo'lsa, hammasi kiradi) + joriy o'quvchi qatori */
function split(
  rows: Row[],
  userId: string | null | undefined,
  limit: number,
): Leaderboard {
  const meRow = userId ? rows.find((r) => r.userId === userId) : undefined;
  return {
    entries: rows.filter((r) => r.rank <= limit).map(toEntry),
    me: meRow ? toEntry(meRow) : null,
    total: rows[0]?.total ?? 0,
  };
}

/** Bitta test bo'yicha reyting */
export async function getTestLeaderboard(
  testId: string,
  filter: Filter,
): Promise<Leaderboard> {
  await finalizeExpiredAttempts({ testId });
  const limit = filter.limit ?? LEADERBOARD_LIMIT;
  const userId = filter.userId ?? null;

  const rows = await db.$queryRaw<Row[]>`
    WITH ranked AS (
      SELECT a."userId", u."fullName", g."name" AS "groupName",
             a."score"::int AS "score", a."durationSec"::int AS "durationSec", 1 AS "tests",
             RANK() OVER (ORDER BY a."score" DESC, a."durationSec" ASC)::int AS "rank",
             COUNT(*) OVER ()::int AS "total"
      FROM "Attempt" a
      JOIN "User" u ON u."id" = a."userId"
      LEFT JOIN "Group" g ON g."id" = u."groupId"
      WHERE a."testId" = ${testId}
        AND a."isFirst" = true
        AND a."status" IN ('FINISHED', 'EXPIRED')
        AND u."isActive" = true
        AND u."archivedAt" IS NULL
        AND u."role" = 'STUDENT'
        ${groupFilter(filter)}
    )
    SELECT * FROM ranked
    WHERE "rank" <= ${limit} OR "userId" = ${userId}
    ORDER BY "rank", "fullName"
  `;
  return split(rows, userId, limit);
}

/** Umumiy reyting: barcha testlardagi birinchi urinish ballari yig'indisi, teng bo'lsa umumiy vaqt kamrog'i */
export async function getOverallLeaderboard(
  filter: Filter,
): Promise<Leaderboard> {
  await finalizeExpiredAttempts();
  const limit = filter.limit ?? LEADERBOARD_LIMIT;
  const userId = filter.userId ?? null;

  const rows = await db.$queryRaw<Row[]>`
    WITH totals AS (
      SELECT a."userId",
             SUM(a."score")::int AS "score",
             SUM(a."durationSec")::int AS "durationSec",
             COUNT(*)::int AS "tests"
      FROM "Attempt" a
      JOIN "User" u ON u."id" = a."userId"
      WHERE a."isFirst" = true
        AND a."status" IN ('FINISHED', 'EXPIRED')
        AND u."isActive" = true
        AND u."archivedAt" IS NULL
        AND u."role" = 'STUDENT'
        ${groupFilter(filter)}
      GROUP BY a."userId"
    ),
    ranked AS (
      SELECT t.*, u."fullName", g."name" AS "groupName",
             RANK() OVER (ORDER BY t."score" DESC, t."durationSec" ASC)::int AS "rank",
             COUNT(*) OVER ()::int AS "total"
      FROM totals t
      JOIN "User" u ON u."id" = t."userId"
      LEFT JOIN "Group" g ON g."id" = u."groupId"
    )
    SELECT * FROM ranked
    WHERE "rank" <= ${limit} OR "userId" = ${userId}
    ORDER BY "rank", "fullName"
  `;
  return split(rows, userId, limit);
}

/** Natija sahifasi uchun: attempt egasining test reytingidagi (barcha guruhlar) o'rni */
export async function getTestRank(attempt: {
  testId: string;
  userId: string;
  isFirst: boolean;
}): Promise<{ rank: number; total: number } | null> {
  if (!attempt.isFirst) return null;
  const board = await getTestLeaderboard(attempt.testId, {
    groupId: null,
    userId: attempt.userId,
    limit: 0,
  });
  return board.me ? { rank: board.me.rank, total: board.total } : null;
}
