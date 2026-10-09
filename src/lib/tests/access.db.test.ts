import { beforeEach, describe, expect, it } from "vitest";
import type { CurrentUser } from "@/lib/auth/guards";
import { getScope } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import {
  resolveLeaderboard,
  type ResolvedLeaderboard,
  type LeaderboardError,
} from "@/lib/leaderboard-access";
import { getTestResults } from "@/lib/results-data";
import { resetDatabase } from "@/test/db";
import { getTestAccess, outOfScopeGroups } from "./access";

let teacher: CurrentUser;
let manager: CurrentUser;
let mine: string; // menejer regionidagi guruh
let other: string; // boshqa region guruhi

async function user(
  username: string,
  role: CurrentUser["role"],
  extra: { regionId?: string; groupId?: string } = {},
): Promise<CurrentUser> {
  const u = await db.user.create({
    data: { username, fullName: username, passwordHash: "x", role, ...extra },
  });
  return {
    id: u.id,
    username,
    fullName: username,
    role,
    groupId: u.groupId,
    regionId: u.regionId,
  };
}

let counter = 0;
async function test(createdById: string, groupIds: string[]) {
  counter++;
  return (
    await db.test.create({
      data: {
        title: `Test ${counter}`,
        durationMin: 10,
        createdById,
        isActive: true,
        groups: { connect: groupIds.map((id) => ({ id })) },
        questions: {
          create: {
            text: "2+2?",
            type: "SINGLE",
            points: 1,
            order: 0,
            options: {
              create: [
                { text: "4", isCorrect: true, order: 0 },
                { text: "5", isCorrect: false, order: 1 },
              ],
            },
          },
        },
      },
    })
  ).id;
}

async function attempt(userId: string, testId: string, score: number) {
  const now = new Date();
  await db.attempt.create({
    data: {
      userId,
      testId,
      isFirst: true,
      status: "FINISHED",
      score,
      maxScore: 1,
      durationSec: 30,
      startedAt: now,
      deadlineAt: new Date(now.getTime() + 600_000),
      finishedAt: now,
    },
  });
}

function names(r: ResolvedLeaderboard | LeaderboardError): string[] {
  if ("error" in r) throw new Error(r.error);
  return r.board.entries.map((e) => e.fullName);
}

beforeEach(async () => {
  await resetDatabase();
  const north = (await db.region.create({ data: { name: "Shimol" } })).id;
  const south = (await db.region.create({ data: { name: "Janub" } })).id;
  mine = (await db.group.create({ data: { name: "N-1", regionId: north } })).id;
  other = (await db.group.create({ data: { name: "S-1", regionId: south } }))
    .id;
  teacher = await user("teacher", "TEACHER");
  manager = await user("manager", "MANAGER", { regionId: north });
});

describe("getTestAccess", () => {
  it("o'zi yaratgan, guruhlari doirada — tahrirlaydi", async () => {
    const t = await test(manager.id, [mine]);
    expect(await getTestAccess(manager, t)).toMatchObject({ canEdit: true });
  });

  it("aralash guruhli o'z testi — faqat ko'rish", async () => {
    const t = await test(manager.id, [mine, other]);
    expect(await getTestAccess(manager, t)).toMatchObject({ canEdit: false });
  });

  it("o'qituvchi testi doiradagi guruhda — faqat ko'rish; boshqa regionniki — ko'rinmaydi", async () => {
    const shared = await test(teacher.id, [mine]);
    const foreign = await test(teacher.id, [other]);
    expect(await getTestAccess(manager, shared)).toMatchObject({
      canEdit: false,
    });
    expect(await getTestAccess(manager, foreign)).toBeNull();
    expect(await getTestAccess(teacher, foreign)).toMatchObject({
      canEdit: true,
    });
  });

  it("boshqa region guruhiga biriktirib bo'lmaydi", async () => {
    const scope = await getScope(manager);
    expect(outOfScopeGroups(scope, [mine])).toEqual([]);
    expect(outOfScopeGroups(scope, [mine, other])).toEqual([other]);
    expect(outOfScopeGroups(await getScope(teacher), [other])).toEqual([]);
  });
});

describe("natijalar va reyting doirasi", () => {
  it("menejer aralash testda faqat o'z guruhi natijalarini ko'radi", async () => {
    const ali = await user("ali", "STUDENT", { groupId: mine });
    const vali = await user("vali", "STUDENT", { groupId: other });
    const t = await test(teacher.id, [mine, other]);
    await attempt(ali.id, t, 1);
    await attempt(vali.id, t, 0);

    const access = await getTestAccess(manager, t);
    expect(access).toMatchObject({ canEdit: false });
    const results = await getTestResults(t, null, access!.scope);
    expect(results?.rows.map((r) => r.student.fullName)).toEqual(["ali"]);
    // Statistika ham faqat doiradagi birinchi urinishlar bo'yicha
    expect(results?.firstAttemptCount).toBe(1);
    expect(results?.questionStats[0].total).toBe(1);

    const all = await getTestResults(t, null, await getScope(teacher));
    expect(all?.rows).toHaveLength(2);
  });

  it("reyting: umumiy — faqat doiradagilar, boshqa guruh va test — 403", async () => {
    const ali = await user("ali", "STUDENT", { groupId: mine });
    const vali = await user("vali", "STUDENT", { groupId: other });
    const t = await test(teacher.id, [mine, other]);
    await attempt(ali.id, t, 1);
    await attempt(vali.id, t, 1);

    expect(names(await resolveLeaderboard(manager, { scope: "all" }))).toEqual([
      "ali",
    ]);
    expect(
      names(await resolveLeaderboard(manager, { testId: t, scope: "all" })),
    ).toEqual(["ali"]);
    expect(
      names(await resolveLeaderboard(teacher, { scope: "all" })).sort(),
    ).toEqual(["ali", "vali"]);

    expect(
      await resolveLeaderboard(manager, { scope: "group", groupId: other }),
    ).toMatchObject({ status: 403 });
    const foreignTest = await test(teacher.id, [other]);
    expect(
      await resolveLeaderboard(manager, { testId: foreignTest, scope: "all" }),
    ).toMatchObject({ status: 403 });
  });
});
