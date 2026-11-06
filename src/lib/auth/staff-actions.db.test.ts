import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import { addDays, toDbDate, todayInTashkent } from "@/lib/time";
import { standardCategories } from "@/test/grading";

// Server action'lar doirasi (ROLES.md §9): o'qituvchi URL yoki id'ni o'zgartirib boshqa
// o'qituvchining guruhi, o'quvchisi, semestri yoki shabloniga tega olmaydi.
// Sessiya o'rniga joriy foydalanuvchi qo'lda beriladi (guards.ts mock)

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

const { createGroup, renameGroup, deleteGroup } =
  await import("@/app/(teacher)/teacher/groups/actions");
const {
  createManager,
  linkManager,
  resetManagerPassword,
  setManagerGroups,
  unlinkManager,
} = await import("@/app/(teacher)/teacher/managers/actions");
const { setStudentArchived, deleteStudent } =
  await import("@/app/(teacher)/teacher/students/actions");
const { saveAttendance } =
  await import("@/app/(teacher)/teacher/attendance/actions");
const { createPenaltyType, updatePenaltyType, applyPenaltyAction } =
  await import("@/app/(teacher)/teacher/penalties/actions");
const { createSemester } =
  await import("@/app/(teacher)/teacher/grades/actions");
const { FORBIDDEN } = await import("@/lib/auth/scope");

const today = todayInTashkent();

let alibek: CurrentUser;
let bobur: CurrentUser;
let north: string;
let south: string;
let a1: string; // alibek, Shimol
let aFree: string; // alibek, regionsiz
let b1: string; // bobur, Shimol

async function user(
  username: string,
  role: CurrentUser["role"],
  extra: { regionId?: string; groupId?: string; createdById?: string } = {},
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

function as(u: CurrentUser) {
  session.user = u;
}

beforeEach(async () => {
  await resetDatabase();
  north = (await db.region.create({ data: { name: "Shimol" } })).id;
  south = (await db.region.create({ data: { name: "Janub" } })).id;
  alibek = await user("alibek", "TEACHER");
  bobur = await user("bobur", "TEACHER");
  await db.teacherRegion.createMany({
    data: [
      { teacherId: alibek.id, regionId: north },
      { teacherId: bobur.id, regionId: north },
    ],
  });
  a1 = (
    await db.group.create({
      data: { teacherId: alibek.id, name: "Frontend-1", regionId: north },
    })
  ).id;
  aFree = (
    await db.group.create({ data: { teacherId: alibek.id, name: "Erkin" } })
  ).id;
  b1 = (
    await db.group.create({
      data: { teacherId: bobur.id, name: "Frontend-1", regionId: north },
    })
  ).id;
});

describe("guruhlar", () => {
  it("boshqa o'qituvchining guruhini o'zgartirib/o'chirib bo'lmaydi", async () => {
    as(alibek);
    expect(await renameGroup(b1, { name: "Buzildi" })).toEqual(FORBIDDEN);
    expect(await deleteGroup(b1)).toEqual(FORBIDDEN);
    expect((await db.group.findUniqueOrThrow({ where: { id: b1 } })).name).toBe(
      "Frontend-1",
    );
  });

  it("guruh faqat o'z regionida yoki regionsiz; kod beriladi", async () => {
    as(alibek);
    expect(await createGroup({ name: "Janubiy", regionId: south })).toEqual({
      ok: false,
      error: "Region topilmadi",
    });
    const r = await createGroup({ name: "Shimoliy", regionId: north });
    expect(r).toMatchObject({ ok: true });
    const created = await db.group.findFirstOrThrow({
      where: { name: "Shimoliy" },
    });
    expect(created.teacherId).toBe(alibek.id);
    expect(created.code).toMatch(/^SHA-\d+-SH$/);
  });

  it("menejer guruh yarata olmaydi", async () => {
    as(await user("m", "MANAGER", { regionId: north }));
    await expect(createGroup({ name: "X", regionId: north })).rejects.toThrow(
      /REDIRECT/,
    );
  });
});

describe("menejerlar", () => {
  it("menejer faqat o'qituvchining regionida yaratiladi va unga bog'lanadi", async () => {
    as(alibek);
    const base = { fullName: "Menejer", password: "parol1234" };
    expect(
      await createManager({ ...base, username: "menejer1", regionId: south }),
    ).toMatchObject({
      ok: false,
      fieldErrors: { regionId: ["Region topilmadi"] },
    });
    expect(
      await createManager({ ...base, username: "menejer1", regionId: north }),
    ).toMatchObject({ ok: true });
    const m = await db.user.findUniqueOrThrow({
      where: { username: "menejer1" },
      include: { teachers: true },
    });
    expect(m.teachers.map((t) => t.teacherId)).toEqual([alibek.id]);
  });

  it("boshqa o'qituvchining guruhi va regionsiz guruh biriktirilmaydi; boshqalarniki saqlanadi", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    await db.teacherManager.createMany({
      data: [
        { teacherId: alibek.id, managerId: m.id },
        { teacherId: bobur.id, managerId: m.id },
      ],
    });
    await db.managerGroup.create({
      data: { managerId: m.id, groupId: b1, assignedById: bobur.id },
    });

    as(alibek);
    expect(await setManagerGroups(m.id, { groupIds: [b1] })).toEqual(FORBIDDEN);
    expect(await setManagerGroups(m.id, { groupIds: [aFree] })).toEqual(
      FORBIDDEN,
    );
    expect(await setManagerGroups(m.id, { groupIds: [a1] })).toMatchObject({
      ok: true,
    });
    // Alibek ro'yxatini almashtirdi — Boburning biriktirishi joyida
    const groups = await db.managerGroup.findMany({
      where: { managerId: m.id },
      select: { groupId: true },
    });
    expect(groups.map((g) => g.groupId).sort()).toEqual([a1, b1].sort());

    expect(await setManagerGroups(m.id, { groupIds: [] })).toMatchObject({
      ok: true,
    });
    expect(
      (await db.managerGroup.findMany({ where: { managerId: m.id } })).map(
        (g) => g.groupId,
      ),
    ).toEqual([b1]);
  });

  it("parolni faqat menejerni yaratgan o'qituvchi tiklaydi; bog'lanmagan menejer — ruxsat yo'q", async () => {
    const byBobur = await user("m", "MANAGER", {
      regionId: north,
      createdById: bobur.id,
    });
    await db.teacherManager.createMany({
      data: [
        { teacherId: alibek.id, managerId: byBobur.id },
        { teacherId: bobur.id, managerId: byBobur.id },
      ],
    });
    const stranger = await user("s", "MANAGER", { regionId: north });

    as(alibek);
    expect(
      await resetManagerPassword(byBobur.id, { password: "yangi12345" }),
    ).toEqual(FORBIDDEN);
    expect(await setManagerGroups(stranger.id, { groupIds: [a1] })).toEqual(
      FORBIDDEN,
    );
    as(bobur);
    expect(
      await resetManagerPassword(byBobur.id, { password: "yangi12345" }),
    ).toMatchObject({ ok: true });
  });
});

describe("mavjud menejer bilan ishlash", () => {
  it("faqat o'z regionidagi menejer qo'shiladi; to'xtatilsa faqat o'z guruhlari olinadi", async () => {
    const m = await user("m", "MANAGER", {
      regionId: north,
      createdById: bobur.id,
    });
    await db.teacherManager.create({
      data: { teacherId: bobur.id, managerId: m.id },
    });
    await db.managerGroup.create({
      data: { managerId: m.id, groupId: b1, assignedById: bobur.id },
    });
    const far = await user("far", "MANAGER", { regionId: south });

    as(alibek);
    expect(await linkManager(far.id)).toEqual(FORBIDDEN);
    expect(await linkManager(m.id)).toMatchObject({ ok: true });
    expect(await setManagerGroups(m.id, { groupIds: [a1] })).toMatchObject({
      ok: true,
    });

    expect(await unlinkManager(m.id)).toMatchObject({ ok: true });
    expect(
      await db.teacherManager.count({
        where: { teacherId: alibek.id, managerId: m.id },
      }),
    ).toBe(0);
    // Boburning guruhi va bog'lanishi joyida
    expect(
      (await db.managerGroup.findMany({ where: { managerId: m.id } })).map(
        (g) => g.groupId,
      ),
    ).toEqual([b1]);
    expect(await unlinkManager(m.id)).toEqual(FORBIDDEN);
  });
});

describe("o'quvchilar", () => {
  it("o'z o'quvchisini tasdiqsiz arxivlaydi; boshqanikini — yo'q; menejer — umuman yo'q", async () => {
    const mine = await user("ali", "STUDENT", { groupId: a1 });
    const foreign = await user("vali", "STUDENT", { groupId: b1 });

    as(alibek);
    expect(await setStudentArchived(foreign.id, true)).toEqual(FORBIDDEN);
    expect(await deleteStudent(foreign.id)).toEqual(FORBIDDEN);
    expect(await setStudentArchived(mine.id, true)).toMatchObject({
      ok: true,
    });
    expect(await deleteStudent(mine.id)).toMatchObject({ ok: true });
    expect(await db.user.count({ where: { id: foreign.id } })).toBe(1);

    as(await user("m", "MANAGER"));
    await expect(setStudentArchived(foreign.id, true)).rejects.toThrow(
      /REDIRECT/,
    );
  });
});

describe("davomat, semestr va jarimalar", () => {
  it("boshqa o'qituvchining guruhiga davomat va semestr yo'q", async () => {
    as(alibek);
    expect(
      await saveAttendance(b1, today, { topic: null, records: [] }),
    ).toEqual(FORBIDDEN);
    expect(
      await createSemester(b1, {
        name: "1-semestr",
        startDate: addDays(today, -10),
        endDate: addDays(today, 80),
        closed: false,
        templateId: "x",
      }),
    ).toEqual(FORBIDDEN);
  });

  it("jarima shablonlari o'qituvchiniki: nom takrorlanishi mumkin, boshqanikiga tegib bo'lmaydi", async () => {
    const type = {
      name: "Darsga kechikish",
      defaultPoints: 1,
      description: "",
      isActive: true,
    };
    as(alibek);
    expect(await createPenaltyType(type)).toMatchObject({ ok: true });
    as(bobur);
    expect(await createPenaltyType(type)).toMatchObject({ ok: true });
    const alibekType = await db.penaltyType.findFirstOrThrow({
      where: { ownerId: alibek.id },
    });
    expect(
      await updatePenaltyType(alibekType.id, {
        ...type,
        name: "Buzildi",
      }),
    ).toEqual({ ok: false, error: "Shablon topilmadi" });

    // Bobur o'z semestrida Alibekning shablonini ishlata olmaydi; Alibekning semestriga — umuman
    const student = await user("ali", "STUDENT", { groupId: b1 });
    await db.groupMembership.create({
      data: {
        studentId: student.id,
        groupId: b1,
        joinedAt: toDbDate(addDays(today, -30)),
      },
    });
    const boburSem = await db.semester.create({
      data: {
        categories: standardCategories,
        groupId: b1,
        name: "1-semestr",
        startDate: toDbDate(addDays(today, -20)),
        endDate: toDbDate(addDays(today, 60)),
      },
    });
    const alibekSem = await db.semester.create({
      data: {
        categories: standardCategories,
        groupId: a1,
        name: "1-semestr",
        startDate: toDbDate(addDays(today, -20)),
        endDate: toDbDate(addDays(today, 60)),
      },
    });
    const apply = (semesterId: string, typeId: string) =>
      applyPenaltyAction({
        semesterId,
        typeId,
        studentIds: [student.id],
        note: "",
        date: today,
      });
    expect(await apply(alibekSem.id, alibekType.id)).toEqual(FORBIDDEN);
    expect(await apply(boburSem.id, alibekType.id)).toMatchObject({
      ok: false,
      error: "Shablon topilmadi yoki nofaol",
    });
    const boburType = await db.penaltyType.findFirstOrThrow({
      where: { ownerId: bobur.id },
    });
    expect(await apply(boburSem.id, boburType.id)).toMatchObject({ ok: true });
  });
});
