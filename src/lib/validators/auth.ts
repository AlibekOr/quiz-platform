import { z } from "zod";
import { fullNameSchema } from "./student";

// Bu yerda maxsus format qoidalari yo'q: noto'g'ri login ham umumiy xabar bilan rad etiladi
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Loginni kiriting")
    .max(64, "Login yoki parol noto'g'ri"),
  password: z
    .string()
    .min(1, "Parolni kiriting")
    .max(128, "Login yoki parol noto'g'ri"),
});

export type LoginInput = z.input<typeof loginSchema>;

/** O'qituvchi o'z parolini o'zgartiradi (/teacher/account) */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Joriy parolni kiriting")
      .max(128, "Joriy parol noto'g'ri"),
    newPassword: z
      .string()
      .min(8, "Yangi parol kamida 8 belgi")
      .max(72, "Parol 72 belgidan oshmasin"),
    confirmPassword: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.confirmPassword !== v.newPassword)
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Parollar mos kelmadi",
      });
    if (v.currentPassword && v.newPassword === v.currentPassword)
      ctx.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Yangi parol eskisidan farq qilsin",
      });
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

/** O'qituvchi o'z ism-familiyasini o'zgartiradi (/teacher/account) */
export const updateProfileSchema = z.object({ fullName: fullNameSchema });

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
