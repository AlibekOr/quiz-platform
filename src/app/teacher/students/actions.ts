"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { hashPassword } from "@/lib/auth/password";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import {
  MAX_IMPORT_ROWS,
  validateImportRows,
  type ImportRow,
  type ValidatedRow,
} from "@/lib/students/import";
import {
  fullNameSchema,
  passwordSchema,
  usernameSchema,
} from "@/lib/students/schema";

const idSchema = z.string().min(1);

const studentFieldsSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  groupId: z.string().min(1, "Guruhni tanlang"),
});

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

function formFields(formData: FormData) {
  return {
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    groupId: formData.get("groupId"),
  };
}

export async function createStudent(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireTeacher();
  const parsed = studentFieldsSchema
    .extend({ password: passwordSchema })
    .safeParse({ ...formFields(formData), password: formData.get("password") });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
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
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(studentId);
  const parsed = studentFieldsSchema.safeParse(formFields(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
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
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(studentId);
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  try {
    await db.user.update({
      where: { id, role: "STUDENT" },
      data: { passwordHash: await hashPassword(parsed.data) },
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

const importRowsSchema = z
  .array(
    z.object({
      fullName: z.string(),
      username: z.string(),
      password: z.string(),
      group: z.string(),
      line: z.number().int().positive(),
    }),
  )
  .min(1)
  .max(MAX_IMPORT_ROWS);

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

export type ImportPreview =
  { ok: true; rows: ValidatedRow[] } | { ok: false; error: string };

export async function previewStudentImport(
  input: unknown,
): Promise<ImportPreview> {
  await requireTeacher();
  const parsed = importRowsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Fayl ma'lumotlari noto'g'ri" };
  return { ok: true, rows: await validateAgainstDb(parsed.data) };
}

export type ImportResult =
  | { ok: true; created: number }
  | { ok: false; error: string; rows?: ValidatedRow[] };

export async function importStudents(input: unknown): Promise<ImportResult> {
  await requireTeacher();
  const parsed = importRowsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Fayl ma'lumotlari noto'g'ri" };

  // Preview'dan keyin baza o'zgargan bo'lishi mumkin — qayta tekshiramiz
  const rows = await validateAgainstDb(parsed.data);
  if (rows.some((r) => r.errors.length > 0)) {
    return {
      ok: false,
      error: "Ba'zi qatorlarda xato bor. Hech kim qo'shilmadi",
      rows,
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
