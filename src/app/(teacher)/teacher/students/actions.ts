"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { hashPassword } from "@/lib/auth/password";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { getUploadedFile, readFirstSheet } from "@/lib/excel";
import {
  sheetToRows,
  validateImportRows,
  type ImportRow,
  type ValidatedRow,
} from "@/lib/students/import";
import {
  fullNameSchema,
  resetPasswordSchema,
  studentCreateSchema,
  studentUpdateSchema,
  usernameSchema,
  type ResetPasswordInput,
  type StudentCreateInput,
  type StudentUpdateInput,
} from "@/lib/validators/student";

const idSchema = z.string().min(1);

function revalidate() {
  revalidatePath("/teacher/students");
  revalidatePath("/teacher/groups");
}

async function usernameTaken(
  username: string,
  exceptId?: string,
): Promise<boolean> {
  const found = await db.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
      NOT: exceptId ? { id: exceptId } : undefined,
    },
    select: { id: true },
  });
  return found !== null;
}

async function groupExists(groupId: string): Promise<boolean> {
  return (await db.group.count({ where: { id: groupId } })) > 0;
}

export async function createStudent(
  input: StudentCreateInput,
): Promise<ActionResult> {
  await requireTeacher();
  const parsed = studentCreateSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { fullName, username, groupId, password } = parsed.data;

  if (!(await groupExists(groupId)))
    return { ok: false, error: "Guruh topilmadi" };
  if (await usernameTaken(username)) {
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { username: ["Bunday login allaqachon mavjud"] },
    };
  }

  try {
    await db.user.create({
      data: {
        fullName,
        username,
        groupId,
        role: "STUDENT",
        passwordHash: await hashPassword(password),
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return {
        ok: false,
        error: "Maydonlarni tekshiring",
        fieldErrors: { username: ["Bunday login allaqachon mavjud"] },
      };
    }
    throw e;
  }
  revalidate();
  return { ok: true, message: "O'quvchi qo'shildi" };
}

export async function updateStudent(
  studentId: string,
  input: StudentUpdateInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(studentId);
  const parsed = studentUpdateSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { fullName, username, groupId } = parsed.data;

  if (!(await groupExists(groupId)))
    return { ok: false, error: "Guruh topilmadi" };
  if (await usernameTaken(username, id)) {
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { username: ["Bunday login allaqachon mavjud"] },
    };
  }

  try {
    // role sharti: o'qituvchi akkauntlarini bu yerdan o'zgartirib bo'lmaydi
    await db.user.update({
      where: { id, role: "STUDENT" },
      data: { fullName, username, groupId },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "O'quvchi topilmadi" };
    if (isUniqueViolation(e)) {
      return {
        ok: false,
        error: "Maydonlarni tekshiring",
        fieldErrors: { username: ["Bunday login allaqachon mavjud"] },
      };
    }
    throw e;
  }
  revalidate();
  return { ok: true, message: "O'zgarishlar saqlandi" };
}

export async function resetStudentPassword(
  studentId: string,
  input: ResetPasswordInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(studentId);
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  try {
    await db.user.update({
      where: { id, role: "STUDENT" },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "O'quvchi topilmadi" };
    throw e;
  }
  return { ok: true, message: "Parol yangilandi" };
}

export async function setStudentActive(
  studentId: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(studentId);
  const active = z.boolean().parse(isActive);

  try {
    await db.user.update({
      where: { id, role: "STUDENT" },
      data: { isActive: active },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "O'quvchi topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: active ? "Blokdan chiqarildi" : "Bloklandi" };
}

// ---------- Excel import ----------

async function validateAgainstDb(
  rows: (ImportRow & { line: number })[],
): Promise<ValidatedRow[]> {
  const [existing, groups] = await Promise.all([
    db.user.findMany({
      where: {
        OR: rows.map((r) => ({
          username: { equals: r.username, mode: "insensitive" as const },
        })),
      },
      select: { username: true },
    }),
    db.group.findMany({ select: { name: true } }),
  ]);
  return validateImportRows(rows, {
    existingUsernames: new Set(existing.map((u) => u.username)),
    groupNames: new Set(groups.map((g) => g.name)),
  });
}

/** Faylni serverda o'qiydi va tekshiradi. Klient yuborgan "tayyor" qatorlarga ishonilmaydi */
async function parseStudentFile(
  formData: FormData,
): Promise<{ rows: ValidatedRow[] } | { error: string }> {
  const upload = getUploadedFile(formData, ["xlsx"]);
  if ("error" in upload) return upload;
  const sheet = await readFirstSheet(upload.file);
  if ("error" in sheet) return sheet;
  const parsed = sheetToRows(sheet);
  if ("error" in parsed) return parsed;
  return { rows: await validateAgainstDb(parsed.rows) };
}

/** Preview'da parol qaytarilmaydi */
export type ImportPreviewRow = Omit<ValidatedRow, "password">;

function withoutPasswords(rows: ValidatedRow[]): ImportPreviewRow[] {
  return rows.map((r) => ({
    line: r.line,
    fullName: r.fullName,
    username: r.username,
    group: r.group,
    errors: r.errors,
  }));
}

export type ImportPreview =
  { ok: true; rows: ImportPreviewRow[] } | { ok: false; error: string };

export async function previewStudentImport(
  formData: FormData,
): Promise<ImportPreview> {
  await requireTeacher();
  const result = await parseStudentFile(formData);
  if ("error" in result) return { ok: false, error: result.error };
  return { ok: true, rows: withoutPasswords(result.rows) };
}

export type ImportResult =
  | { ok: true; created: number }
  | { ok: false; error: string; rows?: ImportPreviewRow[] };

export async function importStudents(
  formData: FormData,
): Promise<ImportResult> {
  await requireTeacher();
  // Preview'dan keyin baza o'zgargan bo'lishi mumkin — fayl qayta o'qiladi va tekshiriladi
  const result = await parseStudentFile(formData);
  if ("error" in result) return { ok: false, error: result.error };
  const { rows } = result;
  if (rows.some((r) => r.errors.length > 0)) {
    return {
      ok: false,
      error: "Ba'zi qatorlarda xato bor. Hech kim qo'shilmadi",
      rows: withoutPasswords(rows),
    };
  }

  const groups = await db.group.findMany({ select: { id: true, name: true } });
  const groupIdByName = new Map(
    groups.map((g) => [g.name.toLowerCase(), g.id]),
  );

  const data = await Promise.all(
    rows.map(async (r) => ({
      fullName: fullNameSchema.parse(r.fullName),
      username: usernameSchema.parse(r.username),
      passwordHash: await hashPassword(r.password),
      groupId: groupIdByName.get(r.group.toLowerCase())!,
      role: "STUDENT" as const,
    })),
  );

  try {
    const { count } = await db.user.createMany({ data });
    revalidate();
    return { ok: true, created: count };
  } catch (e) {
    if (isUniqueViolation(e)) {
      return {
        ok: false,
        error: "Ba'zi loginlar shu orada band qilindi. Qayta tekshiring",
      };
    }
    throw e;
  }
}
