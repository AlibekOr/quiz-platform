"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { membershipOverlapWhere } from "@/lib/memberships-data";
import { isNotFound } from "@/lib/prisma-errors";
import { fromDbDate, toDbDate } from "@/lib/time";
import {
  homeworkGradesSchema,
  homeworkSchema,
  type HomeworkGradesInput,
  type HomeworkInput,
} from "@/lib/validators/grades";

const idSchema = z.string().min(1).max(64);

function revalidate(homeworkId?: string) {
  revalidatePath("/teacher/homework");
  if (homeworkId) revalidatePath(`/teacher/homework/${homeworkId}`);
  revalidatePath("/teacher/grades");
  revalidatePath("/teacher/students/[id]", "page");
  revalidatePath("/grades");
  revalidatePath("/dashboard");
}

async function periodMissing(periodId: string): Promise<ActionResult | null> {
  if ((await db.period.count({ where: { id: periodId } })) > 0) return null;
  return {
    ok: false,
    error: "Maydonlarni tekshiring",
    fieldErrors: { periodId: ["Davr topilmadi"] },
  };
}

export async function createHomework(
  input: HomeworkInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const parsed = homeworkSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { dueDate, ...data } = parsed.data;

  const missing = await periodMissing(data.periodId);
  if (missing) return missing;
  await db.homework.create({
    data: { ...data, dueDate: toDbDate(dueDate), createdById: teacher.id },
  });
  revalidate();
  return { ok: true, message: "Vazifa qo'shildi" };
}

export async function updateHomework(
  homeworkId: string,
  input: HomeworkInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(homeworkId);
  const parsed = homeworkSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { dueDate, ...data } = parsed.data;

  const missing = await periodMissing(data.periodId);
  if (missing) return missing;
  // Maksimal ball kamaytirilsa, undan katta qo'yilgan ballar qolmasin
  const over = await db.homeworkGrade.count({
    where: { homeworkId: id, points: { gt: data.maxPoints } },
  });
  if (over > 0)
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: {
        maxPoints: [
          `${over} ta o'quvchiga bundan katta ball qo'yilgan. Avval ularni o'zgartiring`,
        ],
      },
    };

  try {
    await db.homework.update({
      where: { id },
      data: { ...data, dueDate: toDbDate(dueDate) },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Vazifa topilmadi" };
    throw e;
  }
  revalidate(id);
  return { ok: true, message: "Vazifa saqlandi" };
}

export async function deleteHomework(
  homeworkId: string,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(homeworkId);
  try {
    await db.$transaction([
      db.gradeExemption.deleteMany({
        where: { itemType: "HOMEWORK", itemId: id },
      }),
      db.homework.delete({ where: { id } }),
    ]);
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Vazifa topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Vazifa o'chirildi" };
}

/**
 * Ballarni saqlash: bo'sh qator — baho o'chiriladi. Faqat davr ichida guruhda bo'lgan
 * o'quvchilarga ball qo'yish mumkin.
 */
export async function saveHomeworkGrades(
  homeworkId: string,
  input: HomeworkGradesInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(homeworkId);
  const parsed = homeworkGradesSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  const homework = await db.homework.findUnique({
    where: { id },
    select: {
      maxPoints: true,
      period: { select: { groupId: true, startDate: true, endDate: true } },
    },
  });
  if (!homework) return { ok: false, error: "Vazifa topilmadi" };

  const rows = parsed.data.grades;
  if (
    rows.some((r) => r.points !== "" && Number(r.points) > homework.maxPoints)
  )
    return { ok: false, error: `Ball ${homework.maxPoints} dan oshmasin` };

  const { groupId, startDate, endDate } = homework.period;
  const ids = [...new Set(rows.map((r) => r.studentId))];
  const members = await db.user.count({
    where: {
      id: { in: ids },
      role: "STUDENT",
      memberships: {
        some: membershipOverlapWhere(
          groupId,
          fromDbDate(startDate),
          fromDbDate(endDate),
        ),
      },
    },
  });
  if (members !== ids.length)
    return {
      ok: false,
      error:
        "Ba'zi o'quvchilar bu davrda guruhda bo'lmagan. Sahifani yangilang",
    };

  const toDelete = rows.filter((r) => r.points === "").map((r) => r.studentId);
  const toSave = rows.filter((r) => r.points !== "");
  await db.$transaction([
    db.homeworkGrade.deleteMany({
      where: { homeworkId: id, studentId: { in: toDelete } },
    }),
    ...toSave.map((r) =>
      db.homeworkGrade.upsert({
        where: {
          homeworkId_studentId: { homeworkId: id, studentId: r.studentId },
        },
        create: {
          homeworkId: id,
          studentId: r.studentId,
          points: Number(r.points),
          note: r.note,
        },
        update: { points: Number(r.points), note: r.note },
      }),
    ),
  ]);
  revalidate(id);
  return { ok: true, message: "Ballar saqlandi" };
}
