import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { ActionResult } from "@/lib/action-result";
import { db } from "@/lib/db";
import type { Role } from "./jwt";

// Ko'rish doirasi (CLAUDE.md, "Majburiy qoidalar"). O'qituvchi hamma narsani ko'radi.
// Menejer: o'z regionidagi guruhlar ∪ unga qo'lda biriktirilgan guruhlar (ManagerGroup).
// Guruhsiz o'quvchini menejer faqat o'zi qo'shgan bo'lsa ko'radi.
// Doira har so'rovda bazadan hisoblanadi: region yoki biriktirish o'zgarsa, eski sessiya ham
// yangi qoidalar bilan ishlaydi (JWT'da hech narsa saqlanmaydi).

export type ScopeUser = { id: string; role: Role; regionId: string | null };

export type Scope =
  { kind: "all" } | { kind: "manager"; managerId: string; groupIds: string[] };

/** Doiradan tashqaridagi id bilan kelgan so'rov (server action'lar uchun; API'da 403) */
export const FORBIDDEN: ActionResult = { ok: false, error: "Ruxsat yo'q" };

export async function getAccessibleGroupIds(
  user: ScopeUser,
): Promise<string[]> {
  if (user.role === "TEACHER") {
    const all = await db.group.findMany({ select: { id: true } });
    return all.map((g) => g.id);
  }
  if (user.role !== "MANAGER") return [];
  const groups = await db.group.findMany({
    where: {
      OR: [
        ...(user.regionId ? [{ regionId: user.regionId }] : []),
        { managers: { some: { managerId: user.id } } },
      ],
    },
    select: { id: true },
  });
  return groups.map((g) => g.id);
}

export async function getScope(user: ScopeUser): Promise<Scope> {
  if (user.role === "TEACHER") return { kind: "all" };
  return {
    kind: "manager",
    managerId: user.id,
    groupIds: user.role === "MANAGER" ? await getAccessibleGroupIds(user) : [],
  };
}

export function canAccessGroup(scope: Scope, groupId: string): boolean {
  return scope.kind === "all" || scope.groupIds.includes(groupId);
}

export function groupScopeWhere(scope: Scope): Prisma.GroupWhereInput {
  return scope.kind === "all" ? {} : { id: { in: scope.groupIds } };
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
          { groupId: null, createdById: scope.managerId },
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
      ...(scope.kind === "manager" ? { archivedAt: null } : {}),
      ...studentScopeWhere(scope),
    },
  });
  return count > 0;
}
