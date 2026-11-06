import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/lib/auth/guards";
import type { Scope } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import { standardCategories } from "@/test/grading";
import { addDays, toDbDate, todayInTashkent } from "./time";

// Xavf ostidagi o'quvchilar (FEATURES.md, A qism): bazadagi ma'lumot bilan

const session = vi.hoisted(() => ({ user: null as CurrentUser | null }));

vi.mock("@/lib/auth/guards", () => {
  const requireUser = async () => {
    if (!session.user) throw new Error("REDIRECT /login");
    return session.user;
  };
  const requireRole = async (roles: readonly string[]) => {
    const user = await requireUser();
    if (!roles.includes(user.role)) throw new Error("REDIRECT home");
    return user;
  };
  return {
    getSession: async () => null,
    getCurrentUser: async () => session.user,
    requireUser,
    requireRole,
    requireAdmin: () => requireRole(["ADMIN"]),
    requireTeacher: () => requireRole(["TEACHER"]),
    requireManager: () => requireRole(["MANAGER"]),
    requireStaff: () => requireRole(["TEACHER", "MANAGER"]),
    requireStudent: () => requireRole(["STUDENT"]),
  };
});

const { getRiskRows } = await import("./risk-data");
const { markReviewed } = await import("@/app/(teacher)/teacher/risk/actions");
const { FORBIDDEN } = await import("@/lib/auth/scope");

const today = todayInTashkent();
const day = (offset: number) => toDbDate(addDays(today, offset));
const at = (offset: number) => new Date(`${addDays(today, offset)}T05:00:00Z`);

let teacher: CurrentUser;
let groupId: string;
let semesterId: string;

async function teacherUser(username: string): Promise<CurrentUser> {
  const u = await db.user.create({
    data: { username, fullName: username, passwordHash: "x", role: "TEACHER" },
  });
  return { ...u, groupId: null, regionId: null };
}

async function student(fullName: string, joinedOffset: number) {
  return (
    await db.user.create({
      data: {
        username: fullName.toLowerCase(),
        fullName,
        passwordHash: "x",
        groupId,
        memberships: { create: { groupId, joinedAt: at(joinedOffset) } },
      },
    })
  ).id;
}

/** Dars va belgilar: { studentId: status } */
async function lesson(
  offset: number,
  marks: Record<string, "PRESENT" | "ABSENT">,
) {
  await db.lesson.create({
    data: {
      groupId,
      date: day(offset),
      attendances: {
        create: Object.entries(marks).map(([studentId, status]) => ({
          studentId,
          status,
        })),
      },
    },
  });
}

const limited = (role: "TEACHER" | "MANAGER"): Scope => ({
  kind: "limited",
  userId: teacher.id,
  role,
  groupIds: [groupId],
  creatorIds: [teacher.id],
});

const kindsOf = async (scope: Scope, forManager: boolean, id: string) =>
  (await getRiskRows(scope, { forManager }))
    .find((r) => r.studentId === id)
    ?.risk.signals.map((s) => s.kind) ?? null;

/** Semestr: boshidan `from` kun o'tgan. 14 kundan kam bo'lsa ball sur'ati tekshirilmaydi */
async function semester(from: number) {
  semesterId = (
    await db.semester.create({
      data: {
        categories: standardCategories,
        groupId,
        name: "1-semestr",
        startDate: day(-from),
        endDate: day(60),
      },
    })
  ).id;
}

beforeEach(async () => {
  await resetDatabase();
  session.user = null;
  teacher = await teacherUser("alibek");
  groupId = (
    await db.group.create({ data: { name: "Frontend", teacherId: teacher.id } })
  ).id;
});

describe("getRiskRows", () => {
  it("guruhga qo'shilishidan oldingi darslar hisoblanmaydi", async () => {
    await semester(10);
    const late = await student("Kech", -3);
    const early = await student("Erta", -10);
    await lesson(-5, { [late]: "ABSENT", [early]: "PRESENT" });
    await lesson(-4, { [late]: "ABSENT", [early]: "PRESENT" });
    await lesson(-2, { [late]: "PRESENT", [early]: "ABSENT" });
    await lesson(-1, { [late]: "PRESENT", [early]: "ABSENT" });

    const scope = limited("TEACHER");
    expect(await kindsOf(scope, false, late)).toBeNull();
    expect(await kindsOf(scope, false, early)).toContain(
      "CONSECUTIVE_ABSENCES",
    );
  });

  it("menejerga ball va jarima signallari qaytmaydi", async () => {
    await semester(30);
    const id = await student("Ali", -40);
    const type = await db.penaltyType.create({
      data: { ownerId: teacher.id, name: "Jarima", defaultPoints: 5 },
    });
    await db.penalty.create({
      data: {
        studentId: id,
        semesterId,
        typeId: type.id,
        points: 5,
        date: day(-1),
        createdById: teacher.id,
      },
    });

    expect(await kindsOf(limited("TEACHER"), false, id)).toEqual(
      expect.arrayContaining(["SCORE_PACE", "PENALTIES"]),
    );
    // Faqat ball signallari — menejer ro'yxatida umuman yo'q
    expect(await kindsOf(limited("MANAGER"), true, id)).toBeNull();
  });

  it("ko'rib chiqilgan o'quvchi yangi signal paydo bo'lsa qayta ko'tariladi", async () => {
    await semester(10);
    const id = await student("Ali", -10);
    await lesson(-2, { [id]: "ABSENT" });
    await lesson(-1, { [id]: "ABSENT" });
    await db.riskReview.create({
      data: {
        studentId: id,
        reviewedById: teacher.id,
        signalKinds: ["CONSECUTIVE_ABSENCES"],
        hideUntil: day(7),
      },
    });
    const row = async () =>
      (await getRiskRows(limited("TEACHER"), { forManager: false })).find(
        (r) => r.studentId === id,
      );
    expect((await row())?.reviewed).not.toBeNull();

    // 4 ta dars, hammasi qoldirilgan — "Davomat past" ham qo'shiladi
    await lesson(-4, { [id]: "ABSENT" });
    await lesson(-3, { [id]: "ABSENT" });
    const after = await row();
    expect(after?.risk.signals.map((s) => s.kind)).toContain("LOW_ATTENDANCE");
    expect(after?.reviewed).toBeNull();
  });
});

describe("markReviewed", () => {
  it("boshqa o'qituvchining o'quvchisi — FORBIDDEN; o'zinikida signallar yoziladi", async () => {
    await semester(10);
    const id = await student("Ali", -10);
    await lesson(-2, { [id]: "ABSENT" });
    await lesson(-1, { [id]: "ABSENT" });

    session.user = await teacherUser("bobur");
    expect(await markReviewed(id, { note: "", days: 7 })).toEqual(FORBIDDEN);
    expect(await db.riskReview.count()).toBe(0);

    session.user = teacher;
    const result = await markReviewed(id, { note: "Gaplashildi", days: 7 });
    expect(result.ok).toBe(true);
    const review = await db.riskReview.findFirstOrThrow();
    expect(review).toMatchObject({
      studentId: id,
      reviewedById: teacher.id,
      note: "Gaplashildi",
      signalKinds: ["CONSECUTIVE_ABSENCES"],
      hideUntil: day(7),
    });
  });
});
