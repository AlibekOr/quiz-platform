"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import {
  FORBIDDEN,
  semesterGroupInScope,
  type Scope,
} from "@/lib/auth/scope";
import { requireTeacherScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import {
  formatPoints,
  isValidPoints,
  passScore,
  type AssignmentCategory,
  type GradeKind,
} from "@/lib/grades";
import { getSemesterGrades } from "@/lib/grades-data";
import { lessonMismatch, lessonTaskMismatch } from "@/lib/homework-data";
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
  revalidatePath("/homework");
  revalidatePath("/teacher");
  revalidatePath("/teacher/attendance");
}

/**
 * Semestr mavjudligi, (berilgan bo'lsa) dars shu semestr guruhida ekanligi va darsga
 * uyga vazifa bilan amaliy birga berilmasligi
 */
async function semesterMissing(
  semesterId: string,
  lessonId: string | null,
  category: AssignmentCategory,
  excludeId?: string,
): Promise<ActionResult | null> {
  if ((await db.semester.count({ where: { id: semesterId } })) === 0)
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { semesterId: ["Semestr topilmadi"] },
    };
  if (!lessonId) return null;
  const mismatch = await lessonMismatch(lessonId, semesterId);
  if (mismatch) return { ok: false, error: mismatch };
  const conflict = await lessonTaskMismatch(lessonId, category, excludeId);
  return conflict
    ? {
        ok: false,
        error: "Maydonlarni tekshiring",
        fieldErrors: { categoryId: [conflict] },
      }
    : null;
}

type CategoryRuleRow = {
  kind: GradeKind;
  itemMin: number;
  itemMax: number;
  step: number;
};

/** Semestrning topshiriq kategoriyasi (og'zaki emas) */
async function semesterCategory(
  semesterId: string,
  categoryId: string,
): Promise<CategoryRuleRow | null> {
  return db.semesterCategory.findFirst({
    where: { id: categoryId, semesterId, kind: { not: "ORAL" } },
    select: { kind: true, itemMin: true, itemMax: true, step: true },
  });
}

const categoryMissing: ActionResult = {
  ok: false,
  error: "Maydonlarni tekshiring",
  fieldErrors: { categoryId: ["Kategoriya topilmadi"] },
};

function maxPointsError(
  rule: CategoryRuleRow,
  maxPoints: number,
): ActionResult | null {
  if (rule.kind === "HOMEWORK" || maxPoints <= rule.itemMax) return null;
  return {
    ok: false,
    error: "Maydonlarni tekshiring",
    fieldErrors: { maxPoints: [`Ko'pi bilan ${rule.itemMax}`] },
  };
}

/** Topshiriq doiradagi guruh semestriga tegishlimi */
async function assignmentInScope(scope: Scope, id: string): Promise<boolean> {
  const assignment = await db.assignment.findUnique({
    where: { id },
    select: { semesterId: true },
  });
  return (
    assignment !== null &&
    (await semesterGroupInScope(scope, assignment.semesterId)) !== null
  );
}

/** Turi kategoriyadan; uyga vazifaning maksimal bali — kategoriyaniki (odatda 1) */
function assignmentData(
  input: z.output<typeof assignmentSchema>,
  rule: CategoryRuleRow,
) {
  const { dueDate, maxPoints, ...rest } = input;
  return {
    ...rest,
    category: rule.kind as AssignmentCategory,
    dueDate: toDbDate(dueDate),
    maxPoints: rule.kind === "HOMEWORK" ? rule.itemMax : maxPoints,
  };
}

export async function createAssignment(
  input: AssignmentInput,
): Promise<ActionResult> {
  const { user: teacher, scope } = await requireTeacherScope();
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if (!(await semesterGroupInScope(scope, parsed.data.semesterId)))
    return FORBIDDEN;
  const rule = await semesterCategory(
    parsed.data.semesterId,
    parsed.data.categoryId,
  );
  if (!rule) return categoryMissing;
  const tooMuch = maxPointsError(rule, parsed.data.maxPoints);
  if (tooMuch) return tooMuch;
  const data = assignmentData(parsed.data, rule);

  const missing = await semesterMissing(
    data.semesterId,
    data.lessonId,
    data.category,
  );
  if (missing) return missing;
  await db.assignment.create({ data: { ...data, createdById: teacher.id } });
  revalidate();
  return { ok: true, message: "Topshiriq qo'shildi" };
}

export async function updateAssignment(
  assignmentId: string,
  input: AssignmentInput,
): Promise<ActionResult> {
  const { scope } = await requireTeacherScope();
  const id = idSchema.parse(assignmentId);
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if (
    !(await assignmentInScope(scope, id)) ||
    !(await semesterGroupInScope(scope, parsed.data.semesterId))
  )
    return FORBIDDEN;
  const rule = await semesterCategory(
    parsed.data.semesterId,
    parsed.data.categoryId,
  );
  if (!rule) return categoryMissing;
  const tooMuch = maxPointsError(rule, parsed.data.maxPoints);
  if (tooMuch) return tooMuch;
  const data = assignmentData(parsed.data, rule);

  const missing = await semesterMissing(
    data.semesterId,
    data.lessonId,
    data.category,
    id,
  );
  if (missing) return missing;
  const current = await db.assignment.findUnique({
    where: { id },
    select: { categoryId: true, _count: { select: { grades: true } } },
  });
  if (!current) return { ok: false, error: "Topshiriq topilmadi" };
  // Ball qo'yilgan topshiriqning kategoriyasi o'zgarsa, ballar boshqa kategoriyaga o'tib ketadi
  if (current.categoryId !== data.categoryId && current._count.grades > 0)
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: {
        categoryId: [
          "Ball qo'yilgan topshiriqning kategoriyasini o'zgartirib bo'lmaydi",
        ],
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
  const { scope } = await requireTeacherScope();
  const id = idSchema.parse(assignmentId);
  if (!(await assignmentInScope(scope, id))) return FORBIDDEN;
  try {
    await db.assignment.delete({ where: { id } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Topshiriq topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Topshiriq o'chirildi" };
}

function pointsRule(rule: CategoryRuleRow, maxPoints: number): string {
  const max =
    rule.kind === "HOMEWORK" ? rule.itemMax : Math.min(maxPoints, rule.itemMax);
  return `Ball ${formatPoints(rule.itemMin)} dan ${formatPoints(max)} gacha, ${formatPoints(rule.step)} qadam bilan`;
}

/**
 * Ballarni saqlash: bo'sh qator — baho o'chiriladi. Faqat semestr ichida guruhda bo'lgan
 * o'quvchilarga. EXTRA (qo'shimcha) — semestr qoidasi bo'yicha: ANYTIME — istalgan
 * o'quvchiga, AFTER_END_BAND — semestr tugagach, failBelow ≤ jami < o'tish bo'lganlarga
 */
export async function saveAssignmentGrades(
  assignmentId: string,
  input: AssignmentGradesInput,
): Promise<ActionResult> {
  const { scope } = await requireTeacherScope();
  const id = idSchema.parse(assignmentId);
  const parsed = assignmentGradesSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if (!(await assignmentInScope(scope, id))) return FORBIDDEN;

  const assignment = await db.assignment.findUnique({
    where: { id },
    select: {
      maxPoints: true,
      semesterId: true,
      categoryRef: {
        select: { kind: true, itemMin: true, itemMax: true, step: true },
      },
    },
  });
  if (!assignment) return { ok: false, error: "Topshiriq topilmadi" };
  const { categoryRef: rule, maxPoints, semesterId } = assignment;

  const rows = parsed.data.grades;
  if (
    rows.some(
      (r) => r.points !== null && !isValidPoints(rule, r.points, maxPoints),
    )
  )
    return { ok: false, error: pointsRule(rule, maxPoints) };

  const ids = [...new Set(rows.map((r) => r.studentId))];
  const sheet = await getSemesterGrades(semesterId, ids);
  if (!sheet || sheet.students.length !== ids.length)
    return {
      ok: false,
      error:
        "Ba'zi o'quvchilar bu semestrda guruhda bo'lmagan. Sahifani yangilang",
    };

  if (rule.kind === "EXTRA") {
    const denied = sheet.students.filter(
      (s) =>
        !s.result.canReceiveExtra &&
        rows.some((r) => r.studentId === s.id && r.points !== null),
    );
    if (denied.length > 0)
      return {
        ok: false,
        error: sheet.semester.ended
          ? `Qo'shimcha ball faqat ${sheet.semester.rules.failBelow} ≤ jami < ${formatPoints(passScore(sheet.semester.rules))} bo'lganlarga: ${denied.map((s) => s.fullName).join(", ")}`
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
