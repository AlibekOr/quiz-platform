import "server-only";
import { db } from "@/lib/db";
import type { OwnContactsData } from "@/lib/validators/auth";
import type { Role } from "./jwt";
import { hashPassword, verifyPassword } from "./password";

// O'z akkaunti (/profile): sessiya yaroqliligi, parol almashtirish, o'quvchi kontaktlari

/**
 * Sessiya hali yaroqlimi: user faol, arxivda emas va sessionVersion mos.
 * Parol almashtirilganda sessionVersion oshadi — eski qurilmalardagi JWT'lar yaroqsiz bo'ladi
 */
export function isSessionValid(
  user: {
    isActive: boolean;
    archivedAt: Date | null;
    sessionVersion: number;
  } | null,
  sessionVersion: number,
): boolean {
  return (
    !!user &&
    user.isActive &&
    !user.archivedAt &&
    user.sessionVersion === sessionVersion
  );
}

export type PasswordChangeResult =
  | { ok: true; role: Role; sessionVersion: number }
  | { ok: false; reason: "wrong-password" };

/** Joriy parol tekshiriladi; muvaffaqiyatda sessionVersion oshadi (joriy qurilmaga yangi sessiya kerak) */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<PasswordChangeResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash)))
    return { ok: false, reason: "wrong-password" };

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await hashPassword(newPassword),
      sessionVersion: { increment: 1 },
    },
    select: { role: true, sessionVersion: true },
  });
  return { ok: true, ...updated };
}

/**
 * O'quvchi o'z telefoni va Telegramini saqlaydi. Faqat shu ikki maydon yoziladi:
 * ota-ona ma'lumotlari va o'qituvchi izohi o'zgarmaydi
 */
export async function saveOwnContacts(
  studentId: string,
  data: OwnContactsData,
): Promise<void> {
  await db.studentProfile.upsert({
    where: { userId: studentId },
    create: { userId: studentId, phone: data.phone, telegram: data.telegram },
    update: { phone: data.phone, telegram: data.telegram },
  });
}
