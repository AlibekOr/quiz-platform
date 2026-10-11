import { beforeEach, describe, expect, it } from "vitest";
import type { CurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { resolveLeaderboard } from "@/lib/leaderboard-access";
import { resetDatabase } from "@/test/db";
import { getSemesterLeaderboard } from "./semester-leaderboard";
import { addDays, toDbDate, todayInTashkent } from "./time";

const today = todayInTashkent();
const day = (offset: number) => toDbDate(addDays(today, offset));

let teacherId: string;
let g1: string;
let g2: string;

async function group(
  name: string,
  semester: { from: number; to: number } | null,
) {
  const g = await db.group.create({ data: { name } });
  if (semester)
    await db.semester.create({
      data: {
        groupId: g.id,
        name: `${name} semestr`,
        startDate: day(semester.from),
        endDate: day(semester.to),
      },
    });
  return g.id;
}

/** O'quvchi + a'zolik + BONUS ball (jami shu ball bo'ladi) */
async function student(fullName: string, gid: string | null, points = 0) {
  const u = await db.user.create({
    data: {
      username: fullName.toLowerCase(),
      fullName,
      passwordHash: "x",
      groupId: gid,
      ...(gid
        ? {
            memberships: {
              create: {
                groupId: gid,
                joinedAt: new Date(`${addDays(today, -60)}T05:00:00Z`),
              },
            },
          }
        : {}),
    },
  });
  if (gid && points > 0) {
    const semester = await db.semester.findFirstOrThrow({
      where: { groupId: gid },
    });
    const bonus = await db.assignment.create({
      data: {
        semesterId: semester.id,
        category: "BONUS",
        title: `Bonus ${fullName}`,
        dueDate: day(-1),
        maxPoints: 60,
        createdById: teacherId,
      },
    });
    await db.assignmentGrade.create({
      data: { assignmentId: bonus.id, studentId: u.id, points },
    });
  }
  return u.id;
}

const names = (entries: { rank: number; fullName: string }[]) =>
  entries.map((e) => `${e.rank}:${e.fullName}`);

beforeEach(async () => {
  await resetDatabase();
  teacherId = (
    await db.user.create({
      data: {
        username: "teacher",
        fullName: "O'qituvchi",
        passwordHash: "x",
        role: "TEACHER",
      },
    })
  ).id;
  g1 = await group("G1", { from: -30, to: 30 });
  g2 = await group("G2", { from: -30, to: 30 });
});

describe("getSemesterLeaderboard", () => {
  it("joriy semestr jami bali bo'yicha, teng ballga bir xil o'rin", async () => {
    await student("Ali", g1, 20);
    await student("Bek", g2, 35);
    await student("Dil", g1, 20);
    await student("Eva", g1, 5);

    const all = await getSemesterLeaderboard({ groupId: null });
    expect(names(all.entries)).toEqual(["1:Bek", "2:Ali", "2:Dil", "4:Eva"]);
    expect(all.entries[0]).toMatchObject({ groupName: "G2", belowNorm: false });

    const one = await getSemesterLeaderboard({ groupId: g1 });
    expect(names(one.entries)).toEqual(["1:Ali", "1:Dil", "3:Eva"]);
  });

  it("arxivlangan, bloklangan, ketgan va guruhsizlar chiqmaydi", async () => {
    await student("Ali", g1, 10);
    const archived = await student("Arxiv", g1, 50);
    await db.user.update({
      where: { id: archived },
      data: { archivedAt: new Date() },
    });
    const blocked = await student("Blok", g1, 40);
    await db.user.update({ where: { id: blocked }, data: { isActive: false } });
    const left = await student("Ketgan", g1, 30);
    await db.groupMembership.updateMany({
      where: { studentId: left },
      data: { leftAt: new Date(`${addDays(today, -1)}T05:00:00Z`) },
    });
    await student("Guruhsiz", null);

    const all = await getSemesterLeaderboard({ groupId: null });
    expect(names(all.entries)).toEqual(["1:Ali"]);
  });

  it("joriy semestri yo'q guruh chiqmaydi", async () => {
    const old = await group("Eski", { from: -90, to: -40 });
    await student("Ali", old, 50);
    await student("Bek", g1, 10);
    const all = await getSemesterLeaderboard({ groupId: null });
    expect(names(all.entries)).toEqual(["1:Bek"]);
  });

  it("top N dan tashqaridagi o'quvchi 'me' da qaytadi", async () => {
    await student("A1", g1, 30);
    await student("A2", g1, 20);
    const me = await student("A3", g1, 10);
    const board = await getSemesterLeaderboard({
      groupId: g1,
      userId: me,
      limit: 2,
    });
    expect(names(board.entries)).toEqual(["1:A1", "2:A2"]);
    expect(board.me).toMatchObject({ rank: 3, total: 10 });
    expect(board.total).toBe(3);
  });
});

describe("resolveLeaderboard (semestr)", () => {
  it("o'quvchi guruhi sessiyadan: URL'dagi groupId e'tiborsiz", async () => {
    const ali = await student("Ali", g1, 10);
    await student("Bek", g2, 20);
    const user: CurrentUser = {
      id: ali,
      username: "ali",
      fullName: "Ali",
      role: "STUDENT",
      groupId: g1,
      regionId: null,
    };
    const r = await resolveLeaderboard(user, { scope: "group", groupId: g2 });
    if ("error" in r) throw new Error(r.error);
    expect(r.kind).toBe("semester");
    expect(r.group?.id).toBe(g1);
    expect(names(r.board.entries)).toEqual(["1:Ali"]);
    expect(r.board.me?.userId).toBe(ali);
  });
});

describe("normativdan pastlar (oxirgi 2 hafta)", () => {
  it("o'tish balidan (36) pastlar qizil va oxirida", async () => {
    const g = await group("Oxiri", { from: -60, to: 10 });
    await student("Ali", g, 20);
    await student("Bek", g, 40);
    await student("Dil", g, 36);
    const board = await getSemesterLeaderboard({ groupId: g });
    expect(names(board.entries)).toEqual(["1:Bek", "2:Dil", "3:Ali"]);
    expect(board.entries.map((e) => e.belowNorm)).toEqual([false, false, true]);
  });

  it("oxirgi 2 haftadan oldin oddiy tartib", async () => {
    await student("Ali", g1, 20);
    await student("Bek", g1, 10);
    const board = await getSemesterLeaderboard({ groupId: g1 });
    expect(names(board.entries)).toEqual(["1:Ali", "2:Bek"]);
    expect(board.entries.every((e) => !e.belowNorm)).toBe(true);
  });
});
