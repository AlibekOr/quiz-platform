"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { cancelAttempt } from "@/lib/attempts";
import { requireStaff } from "@/lib/auth/guards";
import { canAccessStudent, FORBIDDEN, type Scope } from "@/lib/auth/scope";
import { getTestAccess, outOfScopeGroups, staffBase } from "@/lib/tests/access";
import { db } from "@/lib/db";
import { isNotFound } from "@/lib/prisma-errors";
import { getUploadedFile, readFirstSheet } from "@/lib/excel";
import {
  parseJsonQuestions,
  sheetToQuestions,
  type ParsedQuestion,
} from "@/lib/tests/import";
import {
  createTestSchema,
  issueMessages,
  type CreateTestInput,
  questionInputSchema,
  testSettingsSchema,
  type QuestionInput,
  type TestSettingsInput,
} from "@/lib/validators/test";

const idSchema = z.string().min(1).max(64);

function revalidateTest(testId: string) {
  for (const base of ["/teacher", "/manager"]) {
    revalidatePath(`${base}/tests`);
    revalidatePath(`${base}/tests/${testId}`);
  }
}

const TEST_NOT_FOUND: ActionResult = { ok: false, error: "Test topilmadi" };

/**
 * O'qituvchi yoki menejer, test tahrirlanadigan bo'lsa (lib/tests/access.ts).
 * Menejer faqat o'zi yaratgan va barcha guruhlari doirada bo'lgan testni o'zgartiradi
 */
async function requireEditableTest(
  testId: string,
): Promise<{ denied: ActionResult } | { scope: Scope }> {
  const user = await requireStaff();
  const access = await getTestAccess(user, testId);
  if (!access) return { denied: TEST_NOT_FOUND };
  if (!access.canEdit) return { denied: FORBIDDEN };
  return { scope: access.scope };
}

// ---------- Test ----------

export async function createTest(
  input: CreateTestInput,
): Promise<ActionResult> {
  const user = await requireStaff();
  const parsed = createTestSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  // Menejer yaratgan test davrga biriktirilmaydi — buni keyin o'qituvchi qiladi
  const test = await db.test.create({
    data: { ...parsed.data, createdById: user.id },
  });
  const base = staffBase(user.role);
  revalidatePath(`${base}/tests`);
  redirect(`${base}/tests/${test.id}`);
}

export async function updateTestSettings(
  testId: string,
  input: TestSettingsInput,
): Promise<ActionResult> {
  const id = idSchema.parse(testId);
  const editable = await requireEditableTest(id);
  if ("denied" in editable) return editable.denied;
  const parsed = testSettingsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: issueMessages(parsed.error).join(". ") };
  const { groupIds, ...settings } = parsed.data;
  // Menejer testni faqat doiradagi guruhlarga biriktiradi
  if (outOfScopeGroups(editable.scope, groupIds).length > 0) return FORBIDDEN;

  const existingGroups = await db.group.count({
    where: { id: { in: groupIds } },
  });
  if (existingGroups !== new Set(groupIds).size)
    return { ok: false, error: "Guruhlardan biri topilmadi" };

  try {
    // Guruhdan ajratilgan test o'sha guruh davrlaridan ham ajraladi
    await db.$transaction([
      db.test.update({
        where: { id },
        data: {
          ...settings,
          groups: { set: groupIds.map((gid) => ({ id: gid })) },
        },
      }),
      db.testPeriod.deleteMany({
        where: { testId: id, period: { groupId: { notIn: groupIds } } },
      }),
    ]);
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Test topilmadi" };
    throw e;
  }
  revalidateTest(id);
  return { ok: true, message: "Sozlamalar saqlandi" };
}

export async function setTestActive(
  testId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const id = idSchema.parse(testId);
  const active = z.boolean().parse(isActive);
  const editable = await requireEditableTest(id);
  if ("denied" in editable) return editable.denied;

  if (active) {
    const questions = await db.question.count({ where: { testId: id } });
    if (questions === 0)
      return { ok: false, error: "Savolsiz testni faollashtirib bo'lmaydi" };
  }

  try {
    await db.test.update({ where: { id }, data: { isActive: active } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Test topilmadi" };
    throw e;
  }
  revalidateTest(id);
  return {
    ok: true,
    message: active ? "Test faollashtirildi" : "Test to'xtatildi",
  };
}

export async function deleteTest(testId: string): Promise<ActionResult> {
  const id = idSchema.parse(testId);
  const editable = await requireEditableTest(id);
  if ("denied" in editable) return editable.denied;

  try {
    // Savollar, urinishlar, javoblar va davr biriktirishlari cascade bilan o'chadi
    await db.$transaction([
      db.gradeExemption.deleteMany({ where: { itemType: "TEST", itemId: id } }),
      db.test.delete({ where: { id } }),
    ]);
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Test topilmadi" };
    throw e;
  }
  revalidatePath("/teacher/tests");
  revalidatePath("/manager/tests");
  return { ok: true, message: "Test o'chirildi" };
}

// ---------- Natijalar ----------

/** Urinishni bekor qilish (o'chirish): o'quvchi testni noldan qayta ishlaydi */
export async function cancelStudentAttempt(
  attemptId: string,
): Promise<ActionResult> {
  const user = await requireStaff();
  const id = idSchema.parse(attemptId);

  // Menejer: test unga ko'rinsin va o'quvchi doirada bo'lsin
  const attempt = await db.attempt.findUnique({
    where: { id },
    select: { testId: true, userId: true },
  });
  if (!attempt) return { ok: false, error: "Urinish topilmadi" };
  const access = await getTestAccess(user, attempt.testId);
  if (!access || !(await canAccessStudent(access.scope, attempt.userId)))
    return FORBIDDEN;

  const result = await cancelAttempt(id);
  if (!result) return { ok: false, error: "Urinish topilmadi" };

  revalidatePath(`/teacher/tests/${result.testId}/results`);
  revalidatePath(`/manager/tests/${result.testId}/results`);
  revalidatePath(`/teacher/students/${result.userId}`);
  return { ok: true, message: "Urinish bekor qilindi" };
}

// ---------- Savollar ----------

async function nextOrder(testId: string): Promise<number> {
  const last = await db.question.findFirst({
    where: { testId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

export async function createQuestion(
  testId: string,
  input: QuestionInput,
): Promise<ActionResult> {
  const id = idSchema.parse(testId);
  const editable = await requireEditableTest(id);
  if ("denied" in editable) return editable.denied;
  const parsed = questionInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: issueMessages(parsed.error).join(". ") };
  const { options, ...question } = parsed.data;

  await db.question.create({
    data: {
      ...question,
      testId: id,
      order: await nextOrder(id),
      options: {
        create: options.map((o, i) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          order: i,
        })),
      },
    },
  });
  revalidateTest(id);
  return { ok: true, message: "Savol qo'shildi" };
}

export async function updateQuestion(
  questionId: string,
  input: QuestionInput,
): Promise<ActionResult> {
  await requireStaff();
  const id = idSchema.parse(questionId);
  const parsed = questionInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: issueMessages(parsed.error).join(". ") };
  const { options, ...question } = parsed.data;

  const existing = await db.question.findUnique({
    where: { id },
    select: { testId: true, options: { select: { id: true } } },
  });
  if (!existing) return { ok: false, error: "Savol topilmadi" };
  const editable = await requireEditableTest(existing.testId);
  if ("denied" in editable) return editable.denied;

  const existingIds = new Set(existing.options.map((o) => o.id));
  if (options.some((o) => o.id && !existingIds.has(o.id))) {
    return { ok: false, error: "Variantlar ma'lumoti noto'g'ri" };
  }
  const keptIds = new Set(options.flatMap((o) => (o.id ? [o.id] : [])));

  // Variantlar joyida yangilanadi: id'lar o'zgarmasa, saqlangan javoblar buzilmaydi
  await db.$transaction([
    db.question.update({ where: { id }, data: question }),
    db.option.deleteMany({
      where: { questionId: id, id: { notIn: [...keptIds] } },
    }),
    ...options.map((o, i) =>
      o.id
        ? db.option.update({
            where: { id: o.id },
            data: { text: o.text, isCorrect: o.isCorrect, order: i },
          })
        : db.option.create({
            data: {
              questionId: id,
              text: o.text,
              isCorrect: o.isCorrect,
              order: i,
            },
          }),
    ),
  ]);
  revalidateTest(existing.testId);
  return { ok: true, message: "Savol saqlandi" };
}

export async function deleteQuestion(
  questionId: string,
): Promise<ActionResult> {
  await requireStaff();
  const id = idSchema.parse(questionId);

  const question = await db.question.findUnique({
    where: { id },
    select: { testId: true },
  });
  if (!question) return { ok: false, error: "Savol topilmadi" };
  const editable = await requireEditableTest(question.testId);
  if ("denied" in editable) return editable.denied;

  await db.$transaction(async (tx) => {
    await tx.question.delete({ where: { id } });
    const remaining = await tx.question.count({
      where: { testId: question.testId },
    });
    // Oxirgi savol o'chsa, test faol qolmasin
    if (remaining === 0)
      await tx.test.update({
        where: { id: question.testId },
        data: { isActive: false },
      });
  });
  revalidateTest(question.testId);
  return { ok: true, message: "Savol o'chirildi" };
}

export async function moveQuestion(
  questionId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  await requireStaff();
  const id = idSchema.parse(questionId);
  const dir = z.enum(["up", "down"]).parse(direction);

  const question = await db.question.findUnique({
    where: { id },
    select: { testId: true, order: true },
  });
  if (!question) return { ok: false, error: "Savol topilmadi" };
  const editable = await requireEditableTest(question.testId);
  if ("denied" in editable) return editable.denied;

  const neighbor = await db.question.findFirst({
    where: {
      testId: question.testId,
      order: dir === "up" ? { lt: question.order } : { gt: question.order },
    },
    orderBy: { order: dir === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (!neighbor) return { ok: true };

  await db.$transaction([
    db.question.update({ where: { id }, data: { order: neighbor.order } }),
    db.question.update({
      where: { id: neighbor.id },
      data: { order: question.order },
    }),
  ]);
  revalidateTest(question.testId);
  return { ok: true };
}

async function parseQuestionFile(
  formData: FormData,
): Promise<{ questions: ParsedQuestion[] } | { error: string }> {
  const upload = getUploadedFile(formData, ["xlsx", "json"]);
  if ("error" in upload) return upload;
  if (upload.kind === "json")
    return parseJsonQuestions(await upload.file.text());
  const sheet = await readFirstSheet(upload.file);
  if ("error" in sheet) return sheet;
  return sheetToQuestions(sheet);
}

export type QuestionImportPreview =
  { ok: true; questions: ParsedQuestion[] } | { ok: false; error: string };

export async function previewQuestionImport(
  formData: FormData,
): Promise<QuestionImportPreview> {
  await requireStaff();
  const result = await parseQuestionFile(formData);
  return "error" in result
    ? { ok: false, error: result.error }
    : { ok: true, questions: result.questions };
}

export async function importQuestions(
  testId: string,
  formData: FormData,
): Promise<ActionResult> {
  const id = idSchema.parse(testId);
  const editable = await requireEditableTest(id);
  if ("denied" in editable) return editable.denied;

  // Fayl serverda qayta o'qiladi va tekshiriladi
  const result = await parseQuestionFile(formData);
  if ("error" in result) return { ok: false, error: result.error };
  const questions = result.questions.flatMap((q) =>
    q.question ? [q.question] : [],
  );
  if (questions.length !== result.questions.length) {
    return {
      ok: false,
      error: "Savollarda xato bor. Faylni tuzatib, qayta yuklang",
    };
  }

  const start = await nextOrder(id);
  await db.$transaction(
    questions.map(({ options, ...q }, i) =>
      db.question.create({
        data: {
          ...q,
          testId: id,
          order: start + i,
          options: {
            create: options.map((o, oi) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              order: oi,
            })),
          },
        },
      }),
    ),
  );
  revalidateTest(id);
  return { ok: true, message: `${questions.length} ta savol qo'shildi` };
}
