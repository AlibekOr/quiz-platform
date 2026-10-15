import type { Prisma } from "@/generated/prisma/client";

/**
 * O'quvchilar ro'yxati filtri (o'qituvchi: O'quvchilar va Arxiv sahifalari).
 * q — ism, login, Telegram yoki telefon; group — guruh id'si yoki "none" (guruhsiz)
 */
export function studentListWhere(input: {
  q: string;
  group: string;
  archived: boolean;
}): Prisma.UserWhereInput {
  const { q, group, archived } = input;
  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    archivedAt: archived ? { not: null } : null,
  };
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      {
        profile: {
          telegram: { contains: q.replace(/^@/, ""), mode: "insensitive" },
        },
      },
    ];
    // Telefonlar +998XXXXXXXXX ko'rinishida saqlanadi: "90 123" -> "90123"
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 3) {
      where.OR.push(
        { profile: { phone: { contains: digits } } },
        { profile: { parentPhone: { contains: digits } } },
      );
    }
  }
  if (group === "none") where.groupId = null;
  else if (group) where.groupId = group;
  return where;
}
