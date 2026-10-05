"use server";

import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validators/auth";

/**
 * O'qituvchi o'z parolini o'zgartiradi. Joriy parol tekshiriladi (xato urinishlar login
 * bilan bir xil cheklovga tushadi). sessionVersion oshadi: boshqa qurilmalardagi sessiyalar
 * tugaydi, joriy qurilmaga yangi sessiya beriladi.
 */
export async function changeOwnPassword(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { currentPassword, newPassword } = parsed.data;
  const limitKey = teacher.username.toLowerCase();

  if (await isLoginLocked(limitKey)) {
    return {
      ok: false,
      error:
        "Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urinib ko'ring",
    };
  }

  const user = await db.user.findUnique({
    where: { id: teacher.id },
    select: { passwordHash: true },
  });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    await recordLoginFailure(limitKey);
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { currentPassword: ["Joriy parol noto'g'ri"] },
    };
  }

  const updated = await db.user.update({
    where: { id: teacher.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      sessionVersion: { increment: 1 },
    },
    select: { role: true, groupId: true, sessionVersion: true },
  });
  await clearLoginFailures(limitKey);
  await createSession({
    userId: teacher.id,
    role: updated.role,
    groupId: updated.groupId,
    sessionVersion: updated.sessionVersion,
  });
  return {
    ok: true,
    message: "Parol o'zgartirildi. Boshqa qurilmalardagi sessiyalar tugatildi",
  };
}
