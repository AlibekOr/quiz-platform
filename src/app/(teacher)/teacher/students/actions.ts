"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { hashPassword } from "@/lib/auth/password";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { getUploadedFile, readFirstSheet } from "@/lib/excel";
import { latestMembershipDay } from "@/lib/memberships";
import { moveStudent } from "@/lib/memberships-data";
import {
  formatDate,
  isValidDateStr,
  startOfDayInTashkent,
  todayInTashkent,
} from "@/lib/time";
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
  transferSchema,
  usernameSchema,
  type ResetPasswordInput,
  type StudentCreateInput,
  type StudentUpdateInput,
  type TransferInput,
} from "@/lib/validators/student";

const idSchema = z.string().min(1);

function revalidate() {
  revalidatePath("/teacher/students");
  revalidatePath("/teacher/students/[id]", "page");
  revalidatePath("/teacher/groups");
  revalidatePath("/teacher/groups/[id]", "page");
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
  const { fullName, username, groupId, password, ...profile } = parsed.data;

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
        profile: { create: profile },
        memberships: { create: { groupId, joinedAt: new Date() } },
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
  const { fullName, username, ...profile } = parsed.data;

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
      data: {
        fullName,
        username,
        profile: { upsert: { create: profile, update: profile } },
      },
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
      // sessionVersion oshadi: o'quvchining barcha qurilmalardagi sessiyalari tugaydi
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        sessionVersion: { increment: 1 },
      },
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

/** Guruhdan chiqarish: a'zolik yopiladi, test natijalari va davomat tarixi saqlanadi */
export async function removeStudentFromGroup(
  studentId: string,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(studentId);

  const student = await db.user.findFirst({
    where: { id, role: "STUDENT", archivedAt: null },
    select: { groupId: true },
  });
  if (!student) return { ok: false, error: "O'quvchi topilmadi" };
  if (!student.groupId) return { ok: false, error: "O'quvchi guruhsiz" };

  await db.$transaction((tx) =>
    moveStudent(tx, { studentId: id, toGroupId: null, at: new Date() }),
  );
  revalidate();
  return { ok: true, message: "Guruhdan chiqarildi" };
}

/**
 * Boshqa guruhga o'tkazish (bir yoki bir nechta o'quvchi). Hammasi bitta tranzaksiyada:
 * eski a'zolik o'tkazish kuni bilan yopiladi, yangisi ochiladi, User.groupId yangilanadi.
 * Test natijalari o'quvchi bilan birga ko'chadi (Attempt guruhga emas, o'quvchiga bog'langan).
 */
export async function transferStudents(
  input: TransferInput,
): Promise<ActionResult> {
  await requireTeacher();
  const parsed = transferSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { toGroupId, date, note } = parsed.data;
  const studentIds = [...new Set(parsed.data.studentIds)];

  if (!isValidDateStr(date)) {
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { date: ["Sana noto'g'ri"] },
    };
  }
  if (date > todayInTashkent()) {
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { date: ["Kelajakdagi sana bilan o'tkazib bo'lmaydi"] },
    };
  }

  const [group, students] = await Promise.all([
    db.group.findUnique({ where: { id: toGroupId }, select: { name: true } }),
    db.user.findMany({
      where: { id: { in: studentIds }, role: "STUDENT", archivedAt: null },
      select: {
        id: true,
        fullName: true,
        groupId: true,
        memberships: { select: { joinedAt: true, leftAt: true } },
      },
    }),
  ]);
  if (!group)
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { toGroupId: ["Guruh topilmadi"] },
    };
  if (students.length !== studentIds.length) {
    return {
      ok: false,
      error: "Ba'zi o'quvchilar topilmadi yoki arxivda. Sahifani yangilang",
    };
  }

  const already = students.filter((s) => s.groupId === toGroupId);
  if (already.length > 0) {
    return {
      ok: false,
      error: `Allaqachon "${group.name}" guruhida: ${already.map((s) => s.fullName).join(", ")}`,
    };
  }
  // A'zoliklar ustma-ust tushmasin: sana oxirgi qo'shilish/chiqish kunidan oldin bo'lmasin
  for (const s of students) {
    const last = latestMembershipDay(s.memberships);
    if (last && last > date) {
      return {
        ok: false,
        error: "Maydonlarni tekshiring",
        fieldErrors: {
          date: [
            `${s.fullName} guruhlari tarixida oxirgi o'zgarish ${formatDate(last)} da. O'tkazish sanasi undan oldin bo'lmasin`,
          ],
        },
      };
    }
  }

  const at = startOfDayInTashkent(date);
  await db.$transaction(async (tx) => {
    for (const s of students) {
      await moveStudent(tx, { studentId: s.id, toGroupId, at, note });
    }
  });

  revalidate();
  revalidatePath("/teacher/attendance");
  revalidatePath("/teacher/groups/[id]/attendance", "page");
  return {
    ok: true,
    message:
      students.length === 1
        ? `${students[0].fullName} "${group.name}" guruhiga o'tkazildi`
        : `${students.length} ta o'quvchi "${group.name}" guruhiga o'tkazildi`,
  };
}

/** Yumshoq o'chirish: guruhi saqlanadi (tiklanganda qaytadi), sessiyalari yopiladi */
export async function setStudentArchived(
  studentId: string,
  archived: boolean,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(studentId);
  const archive = z.boolean().parse(archived);

  try {
    await db.user.update({
      where: { id, role: "STUDENT" },
      data: archive
        ? { archivedAt: new Date(), sessionVersion: { increment: 1 } }
        : { archivedAt: null },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "O'quvchi topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: archive ? "Arxivlandi" : "Arxivdan tiklandi" };
}

/** Butunlay o'chirish: faqat arxivdagi o'quvchi. Urinishlar, davomat va profil ham o'chadi */
export async function deleteStudent(studentId: string): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(studentId);

  const student = await db.user.findFirst({
    where: { id, role: "STUDENT" },
    select: { archivedAt: true },
  });
  if (!student) return { ok: false, error: "O'quvchi topilmadi" };
  if (!student.archivedAt) {
    return { ok: false, error: "Avval o'quvchini arxivlang" };
  }

  // Attempt'da cascade yo'q — avval qo'lda o'chiriladi (javoblar cascade bilan ketadi)
  try {
    await db.$transaction([
      db.attempt.deleteMany({ where: { userId: id } }),
      db.user.delete({
        where: { id, role: "STUDENT", archivedAt: { not: null } },
      }),
    ]);
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "O'quvchi topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "O'quvchi butunlay o'chirildi" };
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
export type ImportPreviewRow = {
  line: number;
  fullName: string;
  username: string;
  group: string;
  /** Normallashgan bo'lsa shu, aks holda fayldagi qiymat */
  phone: string;
  telegram: string;
  parentName: string;
  errors: string[];
};

function withoutPasswords(rows: ValidatedRow[]): ImportPreviewRow[] {
  return rows.map((r) => ({
    line: r.line,
    fullName: r.fullName,
    username: r.username,
    group: r.group,
    phone: r.profile.phone ?? r.phone,
    telegram: r.profile.telegram ?? r.telegram,
    parentName: r.parentName,
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
      profile: { create: r.profile },
    })),
  );
  const joinedAt = new Date();

  try {
    // createMany ichma-ich profil yarata olmaydi — bitta tranzaksiyada alohida create
    await db.$transaction(
      data.map((d) =>
        db.user.create({
          data: {
            ...d,
            memberships: { create: { groupId: d.groupId, joinedAt } },
          },
          select: { id: true },
        }),
      ),
    );
    revalidate();
    return { ok: true, created: data.length };
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
