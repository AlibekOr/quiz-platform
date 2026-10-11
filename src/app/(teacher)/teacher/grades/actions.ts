"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { toDbDate } from "@/lib/time";
import {
  adjustmentSchema,
  semesterSchema,
  type AdjustmentInput,
  type SemesterInput,
} from "@/lib/validators/grades";

// Semestrlar va ball tuzatishlari: faqat o'qituvchi (TASKS.md, "Huquqlar")

const idSchema = z.string().min(1).max(64);

function revalidateGrades() {
  revalidatePath("/teacher/grades");
  revalidatePath("/teacher/homework");
  revalidatePath("/teacher/groups/[id]", "page");
  revalidatePath("/teacher/students/[id]", "page");
  revalidatePath("/grades");
  revalidatePath("/profile");
}

const nameTaken: ActionResult = {
  ok: false,
  error: "Maydonlarni tekshiring",
  fieldErrors: { name: ["Bu guruhda shunday nomli semestr bor"] },
};

/** Bir guruhda semestrlar ustma-ust tushmasin ("joriy semestr" bitta bo'lishi uchun) */
async function overlapError(
  groupId: string,
  data: { startDate: string; endDate: string },
  exceptId?: string,
): Promise<ActionResult | null> {
  const other = await db.semester.findFirst({
    where: {
      groupId,
      ...(exceptId ? { id: { not: exceptId } } : {}),
      startDate: { lte: toDbDate(data.endDate) },
      endDate: { gte: toDbDate(data.startDate) },
    },
    select: { name: true },
  });
  if (!other) return null;
  return {
    ok: false,
    error: "Maydonlarni tekshiring",
    fieldErrors: {
      startDate: [`"${other.name}" semestri bilan sanalar ustma-ust tushadi`],
    },
  };
}

function semesterData(input: z.output<typeof semesterSchema>) {
  const { startDate, endDate, ...rest } = input;
  return {
    ...rest,
    startDate: toDbDate(startDate),
    endDate: toDbDate(endDate),
  };
}

export async function createSemester(
  groupId: string,
  input: SemesterInput,
): Promise<ActionResult> {
  await requireTeacher();
  const gid = idSchema.parse(groupId);
  const parsed = semesterSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  if ((await db.group.count({ where: { id: gid } })) === 0)
    return { ok: false, error: "Guruh topilmadi" };
  const overlap = await overlapError(gid, parsed.data);
  if (overlap) return overlap;
  try {
    await db.semester.create({
      data: { groupId: gid, ...semesterData(parsed.data) },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return nameTaken;
    throw e;
  }
  revalidateGrades();
  return { ok: true, message: "Semestr qo'shildi" };
}

export async function updateSemester(
  semesterId: string,
  input: SemesterInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(semesterId);
  const parsed = semesterSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  const current = await db.semester.findUnique({
    where: { id },
    select: { groupId: true },
  });
  if (!current) return { ok: false, error: "Semestr topilmadi" };
  const overlap = await overlapError(current.groupId, parsed.data, id);
  if (overlap) return overlap;
  try {
    await db.semester.update({
      where: { id },
      data: semesterData(parsed.data),
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Semestr topilmadi" };
    if (isUniqueViolation(e)) return nameTaken;
    throw e;
  }
  revalidateGrades();
  return { ok: true, message: "Semestr saqlandi" };
}

/** Semestr bilan birga uning topshiriqlari, ballari va tuzatishlari o'chadi */
export async function deleteSemester(
  semesterId: string,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(semesterId);
  try {
    await db.semester.delete({ where: { id } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Semestr topilmadi" };
    throw e;
  }
  revalidateGrades();
  return { ok: true, message: "Semestr o'chirildi" };
}

// ---------- O'quvchi: ball tuzatish ----------

export async function addPointAdjustment(
  studentId: string,
  input: AdjustmentInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const sid = idSchema.parse(studentId);
  const parsed = adjustmentSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { semesterId, points, reason } = parsed.data;

  const student = await db.user.count({
    where: { id: sid, role: "STUDENT", archivedAt: null },
  });
  if (student === 0) return { ok: false, error: "O'quvchi topilmadi" };
  if ((await db.semester.count({ where: { id: semesterId } })) === 0)
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { semesterId: ["Semestr topilmadi"] },
    };

  await db.pointAdjustment.create({
    data: {
      studentId: sid,
      semesterId,
      points,
      reason,
      createdById: teacher.id,
    },
  });
  revalidateGrades();
  return { ok: true, message: "Tuzatish qo'shildi" };
}

export async function deletePointAdjustment(
  adjustmentId: string,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(adjustmentId);
  try {
    await db.pointAdjustment.delete({ where: { id } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Tuzatish topilmadi" };
    throw e;
  }
  revalidateGrades();
  return { ok: true, message: "Tuzatish o'chirildi" };
}
