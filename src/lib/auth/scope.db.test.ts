import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  decideDeletionRequest,
  requestDeletion,
} from "@/lib/deletion-requests";
import { resetDatabase } from "@/test/db";
import {
  canAccessStudent,
  FORBIDDEN,
  getAccessibleGroupIds,
  getScope,
  studentScopeWhere,
  type ScopeUser,
} from "./scope";

let teacher: ScopeUser;
let north: string;
let south: string;
let g1: string; // Shimol
let g2: string; // Shimol
let g3: string; // Janub
let g4: string; // regionsiz

async function user(
  username: string,
  role: "TEACHER" | "MANAGER" | "STUDENT",
  extra: { regionId?: string; groupId?: string; createdById?: string } = {},
): Promise<ScopeUser> {
  const u = await db.user.create({
    data: { username, fullName: username, passwordHash: "x", role, ...extra },
  });
  return { id: u.id, role, regionId: u.regionId };
}

beforeEach(async () => {
  await resetDatabase();
  teacher = await user("teacher", "TEACHER");
  north = (await db.region.create({ data: { name: "Shimol" } })).id;
  south = (await db.region.create({ data: { name: "Janub" } })).id;
  g1 = (await db.group.create({ data: { name: "N-1", regionId: north } })).id;
  g2 = (await db.group.create({ data: { name: "N-2", regionId: north } })).id;
  g3 = (await db.group.create({ data: { name: "S-1", regionId: south } })).id;
  g4 = (await db.group.create({ data: { name: "Erkin" } })).id;
});

describe("getAccessibleGroupIds", () => {
  it("faqat region", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    expect((await getAccessibleGroupIds(m)).sort()).toEqual([g1, g2].sort());
  });

  it("faqat biriktirilgan (regionsiz menejer)", async () => {
    const m = await user("m", "MANAGER");
    await db.managerGroup.create({ data: { managerId: m.id, groupId: g3 } });
    expect(await getAccessibleGroupIds(m)).toEqual([g3]);
  });

  it("region va biriktirilgan birga", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    await db.managerGroup.create({ data: { managerId: m.id, groupId: g4 } });
    expect((await getAccessibleGroupIds(m)).sort()).toEqual(
      [g1, g2, g4].sort(),
    );
  });

  it("region ham, biriktirish ham yo'q — bo'sh; o'qituvchi — hammasi", async () => {
    const m = await user("m", "MANAGER");
    expect(await getAccessibleGroupIds(m)).toEqual([]);
    expect((await getAccessibleGroupIds(teacher)).sort()).toEqual(
      [g1, g2, g3, g4].sort(),
    );
  });
});

describe("menejer doirasi: o'quvchilar", () => {
  it("boshqa region o'quvchisini ko'ra olmaydi va unga amal qila olmaydi", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    const mine = await user("ali", "STUDENT", { groupId: g1 });
    const other = await user("vali", "STUDENT", { groupId: g3 });
    const scope = await getScope(m);

    expect(await canAccessStudent(scope, mine.id)).toBe(true);
    expect(await canAccessStudent(scope, other.id)).toBe(false);
    expect(await requestDeletion(m, other.id, "sabab")).toEqual(FORBIDDEN);
    expect(await db.deletionRequest.count()).toBe(0);

    // Qidiruv OR'i bilan birga ham doira saqlanadi
    const visible = await db.user.findMany({
      where: {
        role: "STUDENT",
        OR: [{ fullName: { contains: "li" } }],
        ...studentScopeWhere(scope),
      },
      select: { id: true },
    });
    expect(visible.map((v) => v.id)).toEqual([mine.id]);
  });

  it("guruhsiz o'quvchini faqat o'zi qo'shgan bo'lsa ko'radi", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    const own = await user("own", "STUDENT", { createdById: m.id });
    const foreign = await user("foreign", "STUDENT", {
      createdById: teacher.id,
    });
    const scope = await getScope(m);
    expect(await canAccessStudent(scope, own.id)).toBe(true);
    expect(await canAccessStudent(scope, foreign.id)).toBe(false);
  });

  it("region o'zgarsa doira darhol o'zgaradi (bazadan hisoblanadi)", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    const s = await user("s", "STUDENT", { groupId: g3 });
    expect(await canAccessStudent(await getScope(m), s.id)).toBe(false);
    await db.user.update({ where: { id: m.id }, data: { regionId: south } });
    expect(
      await canAccessStudent(await getScope({ ...m, regionId: south }), s.id),
    ).toBe(true);
  });
});

describe("o'chirish so'rovlari", () => {
  it("menejer o'chira olmaydi, faqat so'raydi; tasdiqdan keyin arxivlanadi", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    const s = await user("s", "STUDENT", { groupId: g1 });

    expect(await requestDeletion(m, s.id, "Ketdi")).toMatchObject({
      ok: true,
    });
    const req = await db.deletionRequest.findFirstOrThrow();
    expect(req).toMatchObject({ status: "PENDING", requestedById: m.id });

    // Menejer o'zi tasdiqlay olmaydi
    expect(
      await decideDeletionRequest(m, req.id, { approve: true, note: null }),
    ).toEqual(FORBIDDEN);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: s.id } })).archivedAt,
    ).toBeNull();

    expect(
      await decideDeletionRequest(teacher, req.id, {
        approve: true,
        note: null,
      }),
    ).toMatchObject({ ok: true });
    const student = await db.user.findUniqueOrThrow({ where: { id: s.id } });
    expect(student.archivedAt).not.toBeNull();
    expect(student.sessionVersion).toBe(1);
    expect(
      await db.deletionRequest.findUniqueOrThrow({ where: { id: req.id } }),
    ).toMatchObject({ status: "APPROVED", decidedById: teacher.id });

    // Qayta hal qilib bo'lmaydi
    expect(
      await decideDeletionRequest(teacher, req.id, {
        approve: false,
        note: "x",
      }),
    ).toMatchObject({ ok: false });
  });

  it("ikkinchi PENDING so'rov rad etiladi; rad etilgandan keyin yangisi mumkin", async () => {
    const m = await user("m", "MANAGER", { regionId: north });
    const s = await user("s", "STUDENT", { groupId: g1 });

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
      await decideDeletionRequest(teacher, req.id, {
        approve: false,
        note: null,
      }),
    ).toMatchObject({ ok: false });
    expect(
      await decideDeletionRequest(teacher, req.id, {
        approve: false,
        note: "Hali o'qiyapti",
      }),
    ).toMatchObject({ ok: true });
    expect(await requestDeletion(m, s.id, "3")).toMatchObject({ ok: true });
  });
});
