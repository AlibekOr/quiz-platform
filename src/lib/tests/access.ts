import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getScope, type Scope, type ScopeUser } from "@/lib/auth/scope";
import { db } from "@/lib/db";

// Testlarga ruxsat (PLAN.md, 14-bosqich; ROLES.md). ADMIN — hamma narsa.
// O'qituvchi va menejer: doiradagi guruhlarga biriktirilgan testlar, o'zi yaratgan va
// (o'qituvchi) o'ziga tegishli testlar. Tahrirlash va o'chirish — o'zi yaratgan yoki egasi
// bo'lgan VA barcha guruhlari doirada bo'lgan testda; aks holda "faqat ko'rish" rejimi.
// Ulashilgan testlar bu yerda ko'rinmaydi — ulardan faqat nusxa olinadi

/** Xodimga ko'rinadigan testlar sharti */
export function testScopeWhere(scope: Scope): Prisma.TestWhereInput {
  if (scope.kind === "all") return {};
  return {
    OR: [
      { groups: { some: { id: { in: scope.groupIds } } } },
      { createdById: scope.userId },
      { ownerId: scope.userId },
    ],
  };
}

/** Doiradan tashqaridagi guruhlar (bo'sh bo'lsa — hammasi ruxsat etilgan) */
export function outOfScopeGroups(
  scope: Scope,
  groupIds: readonly string[],
): string[] {
  if (scope.kind === "all") return [];
  return groupIds.filter((id) => !scope.groupIds.includes(id));
}

export type TestAccess = {
  scope: Scope;
  /** Sozlamalar, savollar, faollashtirish va o'chirish */
  canEdit: boolean;
};

/** null — test yo'q yoki foydalanuvchiga ko'rinmaydi */
export async function getTestAccess(
  user: ScopeUser,
  testId: string,
): Promise<TestAccess | null> {
  if (user.role !== "ADMIN" && user.role !== "TEACHER" && user.role !== "MANAGER")
    return null;
  const scope = await getScope(user);
  const test = await db.test.findFirst({
    where: { id: testId, ...testScopeWhere(scope) },
    select: {
      createdById: true,
      ownerId: true,
      groups: { select: { id: true } },
    },
  });
  if (!test) return null;
  const canEdit =
    scope.kind === "all" ||
    ((test.createdById === user.id || test.ownerId === user.id) &&
      outOfScopeGroups(
        scope,
        test.groups.map((g) => g.id),
      ).length === 0);
  return { scope, canEdit };
}

/** O'qituvchi va menejer bo'limlarining bosh yo'li (havolalar va yo'naltirish uchun) */
export type StaffBase = "/teacher" | "/manager";

export function staffBase(role: ScopeUser["role"]): StaffBase {
  return role === "MANAGER" ? "/manager" : "/teacher";
}
