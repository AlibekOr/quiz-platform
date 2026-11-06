import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  decideDeletionRequest,
  requestDeletion,
} from "@/lib/deletion-requests";
import { resetDatabase } from "@/test/db";
import {
  canAccessGroup,
  canAccessStudent,
  FORBIDDEN,
  getAccessibleGroupIds,
  getScope,
  semesterGroupInScope,
  studentScopeWhere,
  type ScopeUser,
} from "./scope";

// Doira (ROLES.md §3, §9): ADMIN — hammasi, TEACHER — o'z guruhlari, MANAGER — unga
// biriktirilganlar (regiondan avtomatik emas). Ikki o'qituvchi bitta regionda

let admin: ScopeUser;
let alibek: ScopeUser; // 1-o'qituvchi
let bobur: ScopeUser; // 2-o'qituvchi, o'sha regionda
let north: string;
let a1: string; // alibek, Shimol
let a2: string; // alibek, Shimol
let aFree: string; // alibek, regionsiz
let b1: string; // bobur, Shimol

async function user(
  username: string,
  role: "ADMIN" | "TEACHER" | "MANAGER" | "STUDENT",
  extra: {
    regionId?: string;
    groupId?: string;
    createdById?: string;
    archivedAt?: Date;
  } = {},
): Promise<ScopeUser> {
  const u = await db.user.create({
    data: { username, fullName: username, passwordHash: "x", role, ...extra },
  });
  return { id: u.id, role, regionId: u.regionId };
}

async function group(teacherId: string, name: string, regionId?: string) {
  return (await db.group.create({ data: { teacherId, name, regionId } })).id;
}

/** Menejer o'qituvchi bilan ishlaydi va o'qituvchi unga guruh biriktiradi */
async function assign(managerId: string, teacherId: string, groupId?: string) {
  await db.teacherManager.upsert({
    where: { teacherId_managerId: { teacherId, managerId } },
    update: {},
    create: { teacherId, managerId },
  });
  if (groupId)
    await db.managerGroup.create({
      data: { managerId, groupId, assignedById: teacherId },
    });
}

beforeEach(async () => {
  await resetDatabase();
  admin = await user("admin", "ADMIN");
  alibek = await user("alibek", "TEACHER");
  bobur = await user("bobur", "TEACHER");
  north = (await db.region.create({ data: { name: "Shimol" } })).id;
  a1 = await group(alibek.id, "Frontend-1", north);
  a2 = await group(alibek.id, "Frontend-2", north);
  aFree = await group(alibek.id, "Erkin");
  // Nom takrorlanishi mumkin — boshqa o'qituvchida ham "Frontend-1"
  b1 = await group(bobur.id, "Frontend-1", north);
});

describe("getAccessibleGroupIds", () => {
  it("ADMIN — hammasi, o'qituvchi — faqat o'ziniki (regionsiz ham)", async () => {
    expect((await getAccessibleGroupIds(admin)).sort()).toEqual(
      [a1, a2, aFree, b1].sort(),
    );
    expect((await getAccessibleGroupIds(alibek)).sort()).toEqual(
      [a1, a2, aFree].sort(),
    );
    expect(await getAccessibleGroupIds(bobur)).toEqual([b1]);
  });

  it("menejer region bo'yicha avtomatik ko'rmaydi — faqat biriktirilganlar", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    expect(await getAccessibleGroupIds(m)).toEqual([]);
    await assign(m.id, alibek.id, a1);
    expect(await getAccessibleGroupIds(m)).toEqual([a1]);
  });

  it("ikki o'qituvchi bitta menejer bilan: menejer ikkalasini, o'qituvchi faqat o'zinikini", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    await assign(m.id, alibek.id, a1);
    await assign(m.id, bobur.id, b1);
    expect((await getAccessibleGroupIds(m)).sort()).toEqual([a1, b1].sort());

    expect(canAccessGroup(await getScope(alibek), b1)).toBe(false);
    expect(canAccessGroup(await getScope(bobur), a1)).toBe(false);
  });

  it("biriktirish o'zgarsa doira darhol o'zgaradi (bazadan hisoblanadi)", async () => {
    const m = await user("m", "MANAGER");
    const s = await user("s", "STUDENT", { groupId: a2 });
    expect(await canAccessStudent(await getScope(m), s.id)).toBe(false);
    await assign(m.id, alibek.id, a2);
    expect(await canAccessStudent(await getScope(m), s.id)).toBe(true);
  });
});

describe("o'quvchilar doirasi", () => {
  it("boshqa o'qituvchining o'quvchisi (aloqa ma'lumotlari bilan) ko'rinmaydi", async () => {
    const mine = await user("ali", "STUDENT", { groupId: a1 });
    const other = await user("vali", "STUDENT", { groupId: b1 });
    await db.studentProfile.create({
      data: { userId: other.id, phone: "+998901112233" },
    });
    const scope = await getScope(alibek);

    expect(await canAccessStudent(scope, mine.id)).toBe(true);
    expect(await canAccessStudent(scope, other.id)).toBe(false);
    expect(await canAccessStudent({ kind: "all" }, other.id)).toBe(true);

    // Qidiruv OR'i bilan birga ham doira saqlanadi (telefon bo'yicha ham)
    const visible = await db.user.findMany({
      where: {
        role: "STUDENT",
        OR: [
          { fullName: { contains: "li" } },
          { profile: { phone: { contains: "901112233" } } },
        ],
        ...studentScopeWhere(scope),
      },
      select: { id: true },
    });
    expect(visible.map((v) => v.id)).toEqual([mine.id]);
  });

  it("guruhsiz o'quvchi: qo'shgan xodim va uning hamkorlari", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    await assign(m.id, alibek.id);
    const byAlibek = await user("s1", "STUDENT", { createdById: alibek.id });
    const byManager = await user("s2", "STUDENT", { createdById: m.id });
    const byBobur = await user("s3", "STUDENT", { createdById: bobur.id });

    const ofAlibek = await getScope(alibek);
    expect(await canAccessStudent(ofAlibek, byAlibek.id)).toBe(true);
    expect(await canAccessStudent(ofAlibek, byManager.id)).toBe(true);
    expect(await canAccessStudent(ofAlibek, byBobur.id)).toBe(false);

    const ofManager = await getScope(m);
    expect(await canAccessStudent(ofManager, byManager.id)).toBe(true);
    expect(await canAccessStudent(ofManager, byAlibek.id)).toBe(true);
    expect(await canAccessStudent(ofManager, byBobur.id)).toBe(false);

    // Bobur menejer bilan ishlamaydi — menejer qo'shganini ko'rmaydi
    expect(await canAccessStudent(await getScope(bobur), byManager.id)).toBe(
      false,
    );
  });

  it("arxivdagini o'qituvchi ko'radi, menejer — yo'q", async () => {
    const m = await user("m", "MANAGER");
    await assign(m.id, alibek.id, a1);
    const s = await user("s", "STUDENT", {
      groupId: a1,
      archivedAt: new Date(),
    });
    expect(await canAccessStudent(await getScope(alibek), s.id)).toBe(true);
    expect(await canAccessStudent(await getScope(m), s.id)).toBe(false);
  });

  it("semestr faqat guruh o'qituvchisi doirasida", async () => {
    const sem = await db.semester.create({
      data: {
        groupId: b1,
        name: "1-semestr",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-12-31"),
      },
    });
    expect(await semesterGroupInScope(await getScope(bobur), sem.id)).toBe(b1);
    expect(await semesterGroupInScope(await getScope(alibek), sem.id)).toBe(
      null,
    );
    expect(await semesterGroupInScope({ kind: "all" }, sem.id)).toBe(b1);
    expect(await semesterGroupInScope({ kind: "all" }, "yo'q")).toBe(null);
  });
});

describe("o'chirish so'rovlari", () => {
  it("menejer faqat so'raydi; so'rovni guruh o'qituvchisi (yoki admin) hal qiladi", async () => {
    const m = await user("m", "MANAGER");
    await assign(m.id, alibek.id, a1);
    const s = await user("s", "STUDENT", { groupId: a1 });

    expect(await requestDeletion(m, s.id, "Ketdi")).toMatchObject({
      ok: true,
    });
    const req = await db.deletionRequest.findFirstOrThrow();
    expect(req).toMatchObject({ status: "PENDING", requestedById: m.id });

    // Menejer o'zi ham, boshqa o'qituvchi ham tasdiqlay olmaydi
    for (const actor of [m, bobur])
      expect(
        await decideDeletionRequest(actor, req.id, {
          approve: true,
          note: null,
        }),
      ).toEqual(FORBIDDEN);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: s.id } })).archivedAt,
    ).toBeNull();

    expect(
      await decideDeletionRequest(alibek, req.id, {
        approve: true,
        note: null,
      }),
    ).toMatchObject({ ok: true });
    const student = await db.user.findUniqueOrThrow({ where: { id: s.id } });
    expect(student.archivedAt).not.toBeNull();
    expect(student.sessionVersion).toBe(1);
    expect(
      await db.deletionRequest.findUniqueOrThrow({ where: { id: req.id } }),
    ).toMatchObject({ status: "APPROVED", decidedById: alibek.id });

    // Qayta hal qilib bo'lmaydi
    expect(
      await decideDeletionRequest(alibek, req.id, {
        approve: false,
        note: "x",
      }),
    ).toMatchObject({ ok: false });
  });

  it("doiradan tashqaridagi o'quvchi uchun so'rov yuborib bo'lmaydi; admin hal qila oladi", async () => {
    const m = await user("m", "MANAGER");
    await assign(m.id, alibek.id, a1);
    const foreign = await user("f", "STUDENT", { groupId: b1 });
    expect(await requestDeletion(m, foreign.id, "x")).toEqual(FORBIDDEN);

    const s = await user("s", "STUDENT", { groupId: a1 });
    await requestDeletion(m, s.id, "x");
    const req = await db.deletionRequest.findFirstOrThrow();
    expect(
      await decideDeletionRequest(admin, req.id, {
        approve: false,
        note: "Hali o'qiyapti",
      }),
    ).toMatchObject({ ok: true });
  });

  it("ikkinchi PENDING so'rov rad etiladi; rad etilgandan keyin yangisi mumkin", async () => {
    const m = await user("m", "MANAGER");
    await assign(m.id, alibek.id, a1);
    const s = await user("s", "STUDENT", { groupId: a1 });

    expect(await requestDeletion(m, s.id, "1")).toMatchObject({ ok: true });
    expect(await requestDeletion(m, s.id, "2")).toMatchObject({
      ok: false,
      error: "Bu o'quvchi uchun so'rov allaqachon kutilmoqda",
    });
    // Bazadagi qisman indeks ham ikkinchisini qabul qilmaydi
    await expect(
      db.deletionRequest.create({
        data: { studentId: s.id, requestedById: m.id, reason: "x" },
      }),
    ).rejects.toThrow();

    const req = await db.deletionRequest.findFirstOrThrow();
    // Rad etishda izoh majburiy
    expect(
      await decideDeletionRequest(alibek, req.id, {
        approve: false,
        note: null,
      }),
    ).toMatchObject({ ok: false });
    expect(
      await decideDeletionRequest(alibek, req.id, {
        approve: false,
        note: "Hali o'qiyapti",
      }),
    ).toMatchObject({ ok: true });
    expect(await requestDeletion(m, s.id, "3")).toMatchObject({ ok: true });
  });
});
