import { z } from "zod";
import { studentProfileSchema } from "./contact";

export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Ism kamida 2 belgi")
  .max(100, "Ism 100 belgidan oshmasin");

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Login kamida 3 belgi")
  .max(32, "Login 32 belgidan oshmasin")
  .regex(
    USERNAME_PATTERN,
    "Login faqat lotin harflari, raqam, '.', '_' va '-' dan iborat bo'lsin",
  );

export const passwordSchema = z
  .string()
  .min(6, "Parol kamida 6 belgi")
  .max(72, "Parol 72 belgidan oshmasin");

export const groupNameSchema = z
  .string()
  .trim()
  .min(1, "Guruh nomini kiriting")
  .max(64, "Guruh nomi 64 belgidan oshmasin");

export const groupFormSchema = z.object({ name: groupNameSchema });
export type GroupFormInput = z.input<typeof groupFormSchema>;

// Aloqa maydonlari ixtiyoriy va formada tekis (flat) turadi
const studentFields = {
  fullName: fullNameSchema,
  username: usernameSchema,
  ...studentProfileSchema.shape,
};

export const studentCreateSchema = z.object({
  ...studentFields,
  groupId: z.string().min(1, "Guruhni tanlang"),
  password: passwordSchema,
});
export type StudentCreateInput = z.input<typeof studentCreateSchema>;

// Guruh bu yerda o'zgarmaydi: faqat "Boshqa guruhga o'tkazish" orqali (a'zolik tarixi yuritiladi)
export const studentUpdateSchema = z.object(studentFields);
export type StudentUpdateInput = z.input<typeof studentUpdateSchema>;

export const MAX_TRANSFER_BATCH = 200;

/** Boshqa guruhga o'tkazish (bir yoki bir nechta o'quvchi). Sana "YYYY-MM-DD", Toshkent */
export const transferSchema = z.object({
  studentIds: z
    .array(z.string().min(1).max(64))
    .min(1, "O'quvchi tanlanmagan")
    .max(
      MAX_TRANSFER_BATCH,
      `Bir martada ${MAX_TRANSFER_BATCH} tadan ko'p emas`,
    ),
  toGroupId: z.string().min(1, "Guruhni tanlang").max(64),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sanani tanlang"),
  note: z
    .string()
    .trim()
    .max(300, "Izoh 300 belgidan oshmasin")
    .nullish()
    .transform((v) => v || null),
  /** Yangi guruhning o'tkazish kunidan oldin muddati tugagan vazifa va testlaridan ozod qilish */
  exemptPast: z.boolean(),
});
export type TransferInput = z.input<typeof transferSchema>;

export const resetPasswordSchema = z.object({ password: passwordSchema });
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

/** GET /api/students/export: groupId berilmasa yoki bo'sh bo'lsa — barcha o'quvchilar */
export const studentExportQuerySchema = z.object({
  groupId: z
    .string()
    .trim()
    .max(64)
    .nullish()
    .transform((v) => v || null),
});
