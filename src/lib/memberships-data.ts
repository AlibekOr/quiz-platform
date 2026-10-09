import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { addDays, startOfDayInTashkent, type DateStr } from "@/lib/time";

type Tx = Prisma.TransactionClient;

/** `date` kuni (Toshkent) guruh a'zosi bo'lganlar: User where sharti */
export function memberOnWhere(
  groupId: string,
  date: DateStr,
): Prisma.UserWhereInput {
  const nextDay = startOfDayInTashkent(addDays(date, 1));
  return {
    memberships: {
      some: {
        groupId,
        joinedAt: { lt: nextDay },
        OR: [{ leftAt: null }, { leftAt: { gte: nextDay } }],
      },
    },
  };
}

/** from..to oralig'ida kamida bir kun guruh a'zosi bo'lganlarning a'zoliklari */
export function membershipOverlapWhere(
  groupId: string,
  from: DateStr,
  to: DateStr,
): Prisma.GroupMembershipWhereInput {
  return {
    groupId,
    joinedAt: { lt: startOfDayInTashkent(addDays(to, 1)) },
    OR: [
      { leftAt: null },
      { leftAt: { gte: startOfDayInTashkent(addDays(from, 1)) } },
    ],
  };
}

/**
 * O'quvchining guruhini o'zgartiradi: ochiq a'zolik `at` bilan yopiladi, `toGroupId` berilsa
 * yangisi ochiladi va User.groupId yangilanadi. Doim tranzaksiya ichida chaqiriladi —
 * groupId va a'zolik bir-biridan ajralib qolmaydi.
 */
export async function moveStudent(
  tx: Tx,
  input: {
    studentId: string;
    toGroupId: string | null;
    at: Date;
    note?: string | null;
  },
): Promise<void> {
  const { studentId, toGroupId, at, note = null } = input;
  await tx.groupMembership.updateMany({
    where: { studentId, leftAt: null },
    data: { leftAt: at },
  });
  if (toGroupId) {
    await tx.groupMembership.create({
      data: { studentId, groupId: toGroupId, joinedAt: at, note },
    });
  }
  await tx.user.update({
    where: { id: studentId, role: "STUDENT" },
    data: { groupId: toGroupId },
  });
}
