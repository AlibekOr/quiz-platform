"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  formatPoints,
  isValidPoints,
  type AssignmentCategory,
} from "@/lib/grades";
import { getSemesterGrades } from "@/lib/grades-data";
import { isNotFound } from "@/lib/prisma-errors";
import { toDbDate } from "@/lib/time";
import {
  assignmentGradesSchema,
  assignmentSchema,
  type AssignmentGradesInput,
  type AssignmentInput,
} from "@/lib/validators/grades";

// Topshiriqlar (uyga vazifa, amaliy, bonus, qo'shimcha) va ularning ballari: faqat o'qituvchi.
// O'quvchi saytda hech narsa topshirmaydi — ishni darsda ko'rsatadi

const idSchema = z.string().min(1).max(64);

function revalidate(assignmentId?: string) {
  revalidatePath("/teacher/homework");
  if (assignmentId) revalidatePath(`/teacher/homework/${assignmentId}`);
  revalidatePath("/teacher/grades");
  revalidatePath("/teacher/students/[id]", "page");
  revalidatePath("/grades");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

async function semesterMissing(
  semesterId: string,
): Promise<ActionResult | null> {
  if ((await db.semester.count({ where: { id: semesterId } })) > 0) return null;
  return {
    ok: false,
    error: "Maydonlarni tekshiring",
    fieldErrors: { semesterId: ["Semestr topilmadi"] },
  };
}

/** Uyga vazifa doim 0 / 0.5 / 1 — maksimal ball 1 */
function assignmentData(input: z.output<typeof assignmentSchema>) {
  const { dueDate, maxPoints, ...rest } = input;
  return {
    ...rest,
    dueDate: toDbDate(dueDate),
    maxPoints: rest.category === "HOMEWORK" ? 1 : maxPoints,
  };
}

export async function createAssignment(
  input: AssignmentInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  const missing = await semesterMissing(parsed.data.semesterId);
  if (missing) return missing;
  await db.assignment.create({
    data: { ...assignmentData(parsed.data), createdById: teacher.id },
  });
  revalidate();
  return { ok: true, message: "Topshiriq qo'shildi" };
}

export async function updateAssignment(
  assignmentId: string,
  input: AssignmentInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(assignmentId);
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const data = assignmentData(parsed.data);

  const missing = await semesterMissing(data.semesterId);
  if (missing) return missing;
  const current = await db.assignment.findUnique({
    where: { id },
    select: { category: true, _count: { select: { grades: true } } },
  });
  if (!current) return { ok: false, error: "Topshiriq topilmadi" };
  // Ball qo'yilgan topshiriqning turi o'zgarsa, ballar boshqa kategoriyaga o'tib ketadi
  if (current.category !== data.category && current._count.grades > 0)
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: {
        category: ["Ball qo'yilgan topshiriqning turini o'zgartirib bo'lmaydi"],
      },
    };
  // Maksimal ball kamaytirilsa, undan katta qo'yilgan ballar qolmasin
  const over = await db.assignmentGrade.count({
    where: { assignmentId: id, points: { gt: data.maxPoints } },
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
    await db.assignment.update({ where: { id }, data });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Topshiriq topilmadi" };
    throw e;
  }
  revalidate(id);
  return { ok: true, message: "Topshiriq saqlandi" };
}

/** Topshiriq bilan birga uning ballari ham o'chadi (cascade) */
export async function deleteAssignment(
  assignmentId: string,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(assignmentId);
  try {
    await db.assignment.delete({ where: { id } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Topshiriq topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Topshiriq o'chirildi" };
}

function pointsRule(category: AssignmentCategory, maxPoints: number): string {
  return category === "HOMEWORK"
    ? "Uyga vazifa bali faqat 0, 0.5 yoki 1"
    : `Ball 0 dan ${formatPoints(maxPoints)} gacha, 0.5 qadam bilan`;
}

/**
 * Ballarni saqlash: bo'sh qator — baho o'chiriladi. Faqat semestr ichida guruhda bo'lgan
 * o'quvchilarga. EXTRA (qo'shimcha) — faqat semestr tugagach va EXTRA'siz jami
 * failBelow ≤ ball < o'tish bali bo'lgan o'quvchilarga
 */
export async function saveAssignmentGrades(
  assignmentId: string,
  input: AssignmentGradesInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(assignmentId);
  const parsed = assignmentGradesSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  const assignment = await db.assignment.findUnique({
    where: { id },
    select: { category: true, maxPoints: true, semesterId: true },
  });
  if (!assignment) return { ok: false, error: "Topshiriq topilmadi" };
  const { category, maxPoints, semesterId } = assignment;

  const rows = parsed.data.grades;
  if (
    rows.some(
      (r) => r.points !== null && !isValidPoints(category, r.points, maxPoints),
    )
  )
    return { ok: false, error: pointsRule(category, maxPoints) };

  const ids = [...new Set(rows.map((r) => r.studentId))];
  const sheet = await getSemesterGrades(semesterId, ids);
  if (!sheet || sheet.students.length !== ids.length)
    return {
      ok: false,
      error:
        "Ba'zi o'quvchilar bu semestrda guruhda bo'lmagan. Sahifani yangilang",
    };

  if (category === "EXTRA") {
    const denied = sheet.students.filter(
      (s) =>
        !s.result.canReceiveExtra &&
        rows.some((r) => r.studentId === s.id && r.points !== null),
    );
    if (denied.length > 0)
      return {
        ok: false,
        error: sheet.semester.ended
          ? `Qo'shimcha ball faqat ${sheet.semester.rules.failBelow} ≤ jami < ${formatPoints(sheet.students[0]?.result.passScore ?? 0)} bo'lganlarga: ${denied.map((s) => s.fullName).join(", ")}`
          : "Qo'shimcha ball faqat semestr tugagandan keyin qo'yiladi",
      };
  }

  const toDelete = rows
    .filter((r) => r.points === null)
    .map((r) => r.studentId);
  const toSave = rows.flatMap((r) =>
    r.points === null ? [] : [{ ...r, points: r.points }],
  );
  await db.$transaction([
    db.assignmentGrade.deleteMany({
      where: { assignmentId: id, studentId: { in: toDelete } },
    }),
    ...toSave.map((r) =>
      db.assignmentGrade.upsert({
        where: {
          assignmentId_studentId: { assignmentId: id, studentId: r.studentId },
        },
        create: {
          assignmentId: id,
          studentId: r.studentId,
          points: r.points,
          note: r.note,
        },
        update: { points: r.points, note: r.note },
      }),
    ),
  ]);
  revalidate(id);
  return { ok: true, message: "Ballar saqlandi" };
}
