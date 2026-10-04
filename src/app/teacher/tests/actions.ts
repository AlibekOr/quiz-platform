"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isNotFound } from "@/lib/prisma-errors";
import { MAX_IMPORT_QUESTIONS } from "@/lib/tests/import";
import {
  issueMessages,
  questionInputSchema,
  testSettingsSchema,
  type QuestionInput,
  type TestSettingsInput,
} from "@/lib/tests/schema";

const idSchema = z.string().min(1);

function revalidateTest(testId: string) {
  revalidatePath("/teacher/tests");
  revalidatePath(`/teacher/tests/${testId}`);
}

// ---------- Test ----------

const createTestSchema = z.object({
  title: testSettingsSchema.shape.title,
  durationMin: testSettingsSchema.shape.durationMin,
});

export async function createTest(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const parsed = createTestSchema.safeParse({
    title: formData.get("title"),
    durationMin: formData.get("durationMin"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const test = await db.test.create({
    data: { ...parsed.data, createdById: teacher.id },
  });
  revalidatePath("/teacher/tests");
  redirect(`/teacher/tests/${test.id}`);
}

export async function updateTestSettings(
  testId: string,
  input: TestSettingsInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(testId);
  const parsed = testSettingsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: issueMessages(parsed.error).join(". ") };
  const { groupIds, ...settings } = parsed.data;

  const existingGroups = await db.group.count({
    where: { id: { in: groupIds } },
  });
  if (existingGroups !== new Set(groupIds).size)
    return { ok: false, error: "Guruhlardan biri topilmadi" };

  try {
    await db.test.update({
      where: { id },
      data: {
        ...settings,
        groups: { set: groupIds.map((gid) => ({ id: gid })) },
      },
    });
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
  await requireTeacher();
  const id = idSchema.parse(testId);
  const active = z.boolean().parse(isActive);

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
  await requireTeacher();
  const id = idSchema.parse(testId);

  try {
    // Savollar, urinishlar va javoblar cascade bilan o'chadi
    await db.test.delete({ where: { id } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Test topilmadi" };
    throw e;
  }
  revalidatePath("/teacher/tests");
  return { ok: true, message: "Test o'chirildi" };
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
  await requireTeacher();
  const id = idSchema.parse(testId);
  const parsed = questionInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: issueMessages(parsed.error).join(". ") };
  const { options, ...question } = parsed.data;

  if ((await db.test.count({ where: { id } })) === 0)
    return { ok: false, error: "Test topilmadi" };

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
  await requireTeacher();
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
  await requireTeacher();
  const id = idSchema.parse(questionId);

  const question = await db.question.findUnique({
    where: { id },
    select: { testId: true },
  });
  if (!question) return { ok: false, error: "Savol topilmadi" };

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
  await requireTeacher();
  const id = idSchema.parse(questionId);
  const dir = z.enum(["up", "down"]).parse(direction);

  const question = await db.question.findUnique({
    where: { id },
    select: { testId: true, order: true },
  });
  if (!question) return { ok: false, error: "Savol topilmadi" };

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

export async function importQuestions(
  testId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(testId);
  const parsed = z
    .array(questionInputSchema)
    .min(1)
    .max(MAX_IMPORT_QUESTIONS)
    .safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Savollarda xato bor. Faylni qayta tekshiring" };

  if ((await db.test.count({ where: { id } })) === 0)
    return { ok: false, error: "Test topilmadi" };

  const start = await nextOrder(id);
  await db.$transaction(
    parsed.data.map(({ options, ...q }, i) =>
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
  return { ok: true, message: `${parsed.data.length} ta savol qo'shildi` };
}
