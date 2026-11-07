import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import type { Role } from "./jwt";

// Ko'rish doirasi (ROLES.md, §3; CLAUDE.md, "Majburiy qoidalar"):
//   ADMIN    — hamma narsa
//   TEACHER  — o'z guruhlari (Group.teacherId)
//   MANAGER  — o'qituvchilar unga biriktirgan guruhlar (ManagerGroup), regiondan avtomatik emas
// Guruhsiz o'quvchi: uni qo'shgan xodim ko'radi; o'qituvchi — o'zi va u ishlaydigan menejerlar
// qo'shganlarini, menejer — o'zi va u ishlaydigan o'qituvchilar qo'shganlarini.
// Doira har so'rovda bazadan hisoblanadi: biriktirish o'zgarsa, eski sessiya ham yangi
// qoidalar bilan ishlaydi (JWT'da hech narsa saqlanmaydi).

export type ScopeUser = { id: string; role: Role; regionId: string | null };

export type Scope =
  | { kind: "all" }
  | {
      kind: "limited";
      userId: string;
      role: "TEACHER" | "MANAGER";
      groupIds: string[];
      /** Guruhsiz o'quvchilari ko'rinadigan xodimlar (o'zi + hamkorlari) */
      creatorIds: string[];
    };

/** Doiradan tashqaridagi id bilan kelgan so'rov (server action'lar uchun; API'da 403) */
export const FORBIDDEN: ActionResult = { ok: false, error: "Ruxsat yo'q" };

export async function getAccessibleGroupIds(
  user: ScopeUser,
): Promise<string[]> {
  const where: Prisma.GroupWhereInput | null =
    user.role === "ADMIN"
      ? {}
      : user.role === "TEACHER"
        ? { teacherId: user.id }
        : user.role === "MANAGER"
          ? { managers: { some: { managerId: user.id } } }
          : null;
  if (!where) return [];
  const groups = await db.group.findMany({ where, select: { id: true } });
  return groups.map((g) => g.id);
}

/** O'qituvchi uchun — u ishlaydigan menejerlar, menejer uchun — o'qituvchilar */
async function partnerIds(user: ScopeUser): Promise<string[]> {
  if (user.role === "TEACHER") {
    const rows = await db.teacherManager.findMany({
      where: { teacherId: user.id },
      select: { managerId: true },
    });
    return rows.map((r) => r.managerId);
  }
  const rows = await db.teacherManager.findMany({
    where: { managerId: user.id },
    select: { teacherId: true },
  });
  return rows.map((r) => r.teacherId);
}

export async function getScope(user: ScopeUser): Promise<Scope> {
  if (user.role === "ADMIN") return { kind: "all" };
  if (user.role !== "TEACHER" && user.role !== "MANAGER")
    return {
      kind: "limited",
      userId: user.id,
      role: "MANAGER",
      groupIds: [],
      creatorIds: [],
    };
  const [groupIds, partners] = await Promise.all([
    getAccessibleGroupIds(user),
    partnerIds(user),
  ]);
  return {
    kind: "limited",
    userId: user.id,
    role: user.role,
    groupIds,
    creatorIds: [user.id, ...partners],
  };
}

export function canAccessGroup(scope: Scope, groupId: string): boolean {
  return scope.kind === "all" || scope.groupIds.includes(groupId);
}

/**
 * Guruhlar so'rovlariga qo'shiladigan shart. AND ichida qaytadi: chaqiruvchining
 * o'z `id` sharti bilan yoyilganda (`{ id, ...groupScopeWhere(scope) }`) bir-birini
 * ustidan yozmaydi.
 */
export function groupScopeWhere(scope: Scope): Prisma.GroupWhereInput {
  return scope.kind === "all"
    ? {}
    : { AND: [{ id: { in: scope.groupIds } }] };
}

/**
 * O'quvchilar so'rovlariga qo'shiladigan shart (role: STUDENT alohida beriladi).
 * AND ichida qaytadi: chaqiruvchining o'z OR'i (qidiruv) bilan to'qnashmaydi.
 * Chaqiruvchi o'zi AND ishlatsa, bu shartni o'sha AND massiviga qo'shsin.
 */
export function studentScopeWhere(scope: Scope): Prisma.UserWhereInput {
  if (scope.kind === "all") return {};
  return {
    AND: [
      {
        OR: [
          { groupId: { in: scope.groupIds } },
          { groupId: null, createdById: { in: scope.creatorIds } },
        ],
      },
    ],
  };
}

/** O'quvchi doirada mavjudmi. Menejer arxivdagilarni umuman ko'rmaydi */
export async function canAccessStudent(
  scope: Scope,
  studentId: string,
): Promise<boolean> {
  const count = await db.user.count({
    where: {
      id: studentId,
      role: "STUDENT",
      ...(scope.kind === "limited" && scope.role === "MANAGER"
        ? { archivedAt: null }
        : {}),
      ...studentScopeWhere(scope),
    },
  });
  return count > 0;
}

/** Semestr doiradagi guruhniki bo'lsa, uning guruhi; aks holda null */
export async function semesterGroupInScope(
  scope: Scope,
  semesterId: string,
): Promise<string | null> {
  const semester = await db.semester.findUnique({
    where: { id: semesterId },
    select: { groupId: true },
  });
  return semester && canAccessGroup(scope, semester.groupId)
    ? semester.groupId
    : null;
}
