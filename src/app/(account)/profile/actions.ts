"use server";

import { revalidatePath } from "next/cache";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { changePassword, saveOwnContacts } from "@/lib/auth/account";
import { requireStudent, requireTeacher, requireUser } from "@/lib/auth/guards";
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "@/lib/auth/rate-limit";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  changePasswordSchema,
  ownContactsSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type OwnContactsInput,
  type UpdateProfileInput,
} from "@/lib/validators/auth";

// O'z profili (/profile). Har bir action foydalanuvchini sessiyadan oladi — boshqa
// odamning id'si qabul qilinmaydi

/** O'qituvchi o'z ism-familiyasini o'zgartiradi (o'quvchi va menejer ismini o'qituvchi o'zgartiradi) */
export async function updateOwnProfile(
  input: UpdateProfileInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  await db.user.update({
    where: { id: teacher.id },
    data: { fullName: parsed.data.fullName },
  });
  // Sarlavhadagi ism ham yangilansin
  revalidatePath("/", "layout");
  return { ok: true, message: "Ism-familiya saqlandi" };
}

/** O'quvchi o'z telefoni va Telegramini saqlaydi (+998XXXXXXXXX, @username) */
export async function updateOwnContacts(
  input: OwnContactsInput,
): Promise<ActionResult> {
  const student = await requireStudent();
  const parsed = ownContactsSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  await saveOwnContacts(student.id, parsed.data);
  revalidatePath("/profile");
  return { ok: true, message: "Aloqa ma'lumotlari saqlandi" };
}

/**
 * Har qanday rol o'z parolini o'zgartiradi. Joriy parol tekshiriladi (xato urinishlar login
 * bilan bir xil cheklovga tushadi). sessionVersion oshadi: boshqa qurilmalardagi sessiyalar
 * tugaydi, joriy qurilmaga yangi sessiya beriladi.
 */
export async function changeOwnPassword(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { currentPassword, newPassword } = parsed.data;
  const limitKey = user.username.toLowerCase();

  if (await isLoginLocked(limitKey)) {
    return {
      ok: false,
      error:
        "Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urinib ko'ring",
    };
  }

  const result = await changePassword(user.id, currentPassword, newPassword);
  if (!result.ok) {
    await recordLoginFailure(limitKey);
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { currentPassword: ["Joriy parol noto'g'ri"] },
    };
  }
  await clearLoginFailures(limitKey);
  await createSession({
    userId: user.id,
    role: result.role,
    sessionVersion: result.sessionVersion,
  });
  return {
    ok: true,
    message: "Parol o'zgartirildi. Boshqa qurilmalardagi sessiyalar tugatildi",
  };
}
