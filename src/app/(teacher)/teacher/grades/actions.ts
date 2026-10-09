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
  exemptionSchema,
  parseItemKey,
  periodSchema,
  testGradingSchema,
  type AdjustmentInput,
  type ExemptionInput,
  type PeriodInput,
  type TestGradingInput,
} from "@/lib/validators/grades";

const idSchema = z.string().min(1).max(64);

function revalidateGrades() {
  revalidatePath("/teacher/grades");
  revalidatePath("/teacher/homework");
  revalidatePath("/teacher/groups/[id]", "page");
  revalidatePath("/teacher/students/[id]", "page");
  revalidatePath("/grades");
}

const nameTaken: ActionResult = {
  ok: false,
  error: "Maydonlarni tekshiring",
  fieldErrors: { name: ["Bu guruhda shunday nomli davr bor"] },
};

// ---------- Davrlar ----------

export async function createPeriod(
  groupId: string,
  input: PeriodInput,
): Promise<ActionResult> {
  await requireTeacher();
  const gid = idSchema.parse(groupId);
  const parsed = periodSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { name, startDate, endDate, passPercent } = parsed.data;

  if ((await db.group.count({ where: { id: gid } })) === 0)
    return { ok: false, error: "Guruh topilmadi" };
  try {
    await db.period.create({
      data: {
        groupId: gid,
        name,
        startDate: toDbDate(startDate),
        endDate: toDbDate(endDate),
        passPercent,
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return nameTaken;
    throw e;
  }
  revalidateGrades();
  return { ok: true, message: "Davr qo'shildi" };
}

export async function updatePeriod(
  periodId: string,
  input: PeriodInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(periodId);
  const parsed = periodSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { name, startDate, endDate, passPercent } = parsed.data;

  try {
    await db.period.update({
      where: { id },
      data: {
        name,
        startDate: toDbDate(startDate),
        endDate: toDbDate(endDate),
        passPercent,
      },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Davr topilmadi" };
    if (isUniqueViolation(e)) return nameTaken;
    throw e;
  }
  revalidateGrades();
  return { ok: true, message: "Davr saqlandi" };
}

/** Davr bilan birga uning vazifalari, ballari, test biriktirishlari va tuzatishlari o'chadi */
export async function deletePeriod(periodId: string): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(periodId);
  try {
    await db.period.delete({ where: { id } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Davr topilmadi" };
    throw e;
  }
  revalidateGrades();
  return { ok: true, message: "Davr o'chirildi" };
}

// ---------- Test: muddat va davrlarga biriktirish ----------

/** Davr faqat test biriktirilgan guruhlardan biriga tegishli bo'lishi mumkin */
export async function saveTestGrading(
  testId: string,
  input: TestGradingInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(testId);
  const parsed = testGradingSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { dueDate, links } = parsed.data;

  const test = await db.test.findUnique({
    where: { id },
    select: { groups: { select: { id: true } } },
  });
  if (!test) return { ok: false, error: "Test topilmadi" };
  const allowed = await db.period.count({
    where: {
      id: { in: links.map((l) => l.periodId) },
      groupId: { in: test.groups.map((g) => g.id) },
    },
  });
  if (allowed !== links.length)
    return {
      ok: false,
      error: "Davr topilmadi yoki test bu davr guruhiga biriktirilmagan",
    };

  await db.$transaction([
    db.test.update({
      where: { id },
      data: { dueDate: dueDate ? toDbDate(dueDate) : null },
    }),
    db.testPeriod.deleteMany({
      where: {
        testId: id,
        periodId: { notIn: links.map((l) => l.periodId) },
      },
    }),
    ...links.map((l) =>
      db.testPeriod.upsert({
        where: { testId_periodId: { testId: id, periodId: l.periodId } },
        create: { testId: id, periodId: l.periodId, points: l.points },
        update: { points: l.points },
      }),
    ),
  ]);
  revalidatePath(`/teacher/tests/${id}`);
  revalidateGrades();
  return { ok: true, message: "Baholash sozlamalari saqlandi" };
}

// ---------- O'quvchi: tuzatish va ozod qilish ----------

async function studentExists(id: string): Promise<boolean> {
  return (
    (await db.user.count({
      where: { id, role: "STUDENT", archivedAt: null },
    })) > 0
  );
}

export async function addPointAdjustment(
  studentId: string,
  input: AdjustmentInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const sid = idSchema.parse(studentId);
  const parsed = adjustmentSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { periodId, points, reason } = parsed.data;

  if (!(await studentExists(sid)))
    return { ok: false, error: "O'quvchi topilmadi" };
  if ((await db.period.count({ where: { id: periodId } })) === 0)
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { periodId: ["Davr topilmadi"] },
    };

  await db.pointAdjustment.create({
    data: { studentId: sid, periodId, points, reason, createdById: teacher.id },
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

export async function addExemption(
  studentId: string,
  input: ExemptionInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const sid = idSchema.parse(studentId);
  const parsed = exemptionSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { itemType, itemId } = parseItemKey(parsed.data.item);

  if (!(await studentExists(sid)))
    return { ok: false, error: "O'quvchi topilmadi" };
  const exists =
    itemType === "HOMEWORK"
      ? await db.homework.count({ where: { id: itemId } })
      : await db.test.count({ where: { id: itemId } });
  if (exists === 0)
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { item: ["Vazifa yoki test topilmadi"] },
    };

  try {
    await db.gradeExemption.create({
      data: {
        studentId: sid,
        itemType,
        itemId,
        reason: parsed.data.reason,
        createdById: teacher.id,
      },
    });
  } catch (e) {
    if (isUniqueViolation(e))
      return { ok: false, error: "O'quvchi bundan allaqachon ozod qilingan" };
    throw e;
  }
  revalidateGrades();
  return { ok: true, message: "Ozod qilindi" };
}

export async function deleteExemption(
  exemptionId: string,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(exemptionId);
  try {
    await db.gradeExemption.delete({ where: { id } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Topilmadi" };
    throw e;
  }
  revalidateGrades();
  return { ok: true, message: "Ozod qilish bekor qilindi" };
}
