import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getScope, type Scope, type ScopeUser } from "@/lib/auth/scope";
import { db } from "@/lib/db";

// Testlarga ruxsat (PLAN.md, 14-bosqich). O'qituvchi — hamma narsa.
// Menejer: doiradagi guruhlarga biriktirilgan testlarni va o'zi yaratgan testlarni ko'radi.
// Tahrirlash va o'chirish — faqat o'zi yaratgan VA barcha guruhlari doirada bo'lgan testda;
// aks holda test "faqat ko'rish" rejimida ochiladi

/** Menejerga ko'rinadigan testlar sharti */
export function testScopeWhere(scope: Scope): Prisma.TestWhereInput {
  if (scope.kind === "all") return {};
  return {
    OR: [
      { groups: { some: { id: { in: scope.groupIds } } } },
      { createdById: scope.managerId },
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
  if (user.role !== "TEACHER" && user.role !== "MANAGER") return null;
  const scope = await getScope(user);
  const test = await db.test.findFirst({
    where: { id: testId, ...testScopeWhere(scope) },
    select: { createdById: true, groups: { select: { id: true } } },
  });
  if (!test) return null;
  const canEdit =
    scope.kind === "all" ||
    (test.createdById === user.id &&
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
