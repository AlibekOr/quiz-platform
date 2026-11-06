"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import type { CurrentUser } from "@/lib/auth/guards";
import { FORBIDDEN } from "@/lib/auth/scope";
import { requireTeacherScope } from "@/lib/auth/staff";
import type { Difficulty } from "@/lib/bank";
import {
  copyBankToTest,
  createBankQuestion,
  importToBank,
  ownsTopic,
  pickFromBank,
  pickOneReplacement,
  saveTestToBank,
  type PickPreviewItem,
} from "@/lib/bank-data";
import { db } from "@/lib/db";
import { getTestAccess } from "@/lib/tests/access";
import type { ParsedQuestion } from "@/lib/tests/import";
import { parseQuestionFile } from "@/lib/tests/question-file";
import {
  bankQuestionIdsSchema,
  bankQuestionInputSchema,
  difficultySchema,
  parseDifficulty,
  pickInputSchema,
  saveToBankSchema,
  topicInputSchema,
  type BankQuestionInput,
  type PickInput,
  type SaveToBankInput,
  type TopicInput,
} from "@/lib/validators/bank";
import { issueMessages } from "@/lib/validators/test";

// Savollar banki (FEATURES.md, B qism): faqat o'qituvchi va faqat o'z banki.
// Boshqa o'qituvchining mavzusi yoki savoli id bilan kelsa — FORBIDDEN

const idSchema = z.string().min(1).max(64);

function errorOf(result: ActionResult): string {
  return result.ok ? "" : result.error;
}

function revalidateBank() {
  revalidatePath("/teacher/bank");
}

async function ownQuestion(ownerId: string, id: string): Promise<boolean> {
  return (await db.bankQuestion.count({ where: { id, ownerId } })) > 0;
}

// ---------- Mavzular ----------

export async function createTopic(input: TopicInput): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const parsed = topicInputSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { name, parentId } = parsed.data;
  if (parentId && !(await ownsTopic(user.id, parentId))) return FORBIDDEN;
  await db.topic.create({ data: { ownerId: user.id, name, parentId } });
  revalidateBank();
  return { ok: true, message: "Mavzu qo'shildi" };
}

export async function renameTopic(
  topicId: string,
  input: TopicInput,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(topicId);
  const parsed = topicInputSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if (!(await ownsTopic(user.id, id))) return FORBIDDEN;
  await db.topic.update({ where: { id }, data: { name: parsed.data.name } });
  revalidateBank();
  return { ok: true, message: "Mavzu nomi o'zgartirildi" };
}

/** Faqat bo'sh mavzu (ichki mavzusi va savoli — arxivdagilari ham — yo'q) */
export async function deleteTopic(topicId: string): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(topicId);
  const topic = await db.topic.findFirst({
    where: { id, ownerId: user.id },
    select: { _count: { select: { children: true, questions: true } } },
  });
  if (!topic) return FORBIDDEN;
  if (topic._count.children > 0 || topic._count.questions > 0)
    return {
      ok: false,
      error:
        "Mavzu bo'sh emas: avval ichki mavzular va savollarni (arxivdagilarini ham) boshqa mavzuga o'tkazing",
    };
  await db.topic.delete({ where: { id } });
  revalidateBank();
  return { ok: true, message: "Mavzu o'chirildi" };
}

// ---------- Savollar ----------

export async function createBankQuestionAction(
  input: BankQuestionInput,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const parsed = bankQuestionInputSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { topicId, difficulty, explanation, tags, ...question } = parsed.data;
  if (!(await ownsTopic(user.id, topicId))) return FORBIDDEN;
  const { added } = await createBankQuestion(user.id, {
    question,
    topicId,
    difficulty,
    explanation,
    tags,
  });
  if (added === 0)
    return { ok: false, error: "Bunday savol bankda allaqachon bor" };
  revalidateBank();
  return { ok: true, message: "Savol bankka qo'shildi" };
}

/** Testlardagi nusxalar o'zgarmaydi (ular test savollari sifatida alohida saqlangan) */
export async function updateBankQuestion(
  questionId: string,
  input: BankQuestionInput,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(questionId);
  const parsed = bankQuestionInputSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { options, topicId, ...data } = parsed.data;
  if (!(await ownQuestion(user.id, id))) return FORBIDDEN;
  if (!(await ownsTopic(user.id, topicId))) return FORBIDDEN;
  await db.$transaction([
    db.bankOption.deleteMany({ where: { bankQuestionId: id } }),
    db.bankQuestion.update({
      where: { id },
      data: {
        ...data,
        topicId,
        options: {
          create: options.map((o, i) => ({
            text: o.text,
            isCorrect: o.isCorrect,
            order: i,
          })),
        },
      },
    }),
  ]);
  revalidateBank();
  return { ok: true, message: "Savol saqlandi" };
}

export async function setBankQuestionArchived(
  questionId: string,
  archived: boolean,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(questionId);
  if (!(await ownQuestion(user.id, id))) return FORBIDDEN;
  await db.bankQuestion.update({
    where: { id },
    data: { archivedAt: z.boolean().parse(archived) ? new Date() : null },
  });
  revalidateBank();
  return {
    ok: true,
    message: archived ? "Savol arxivlandi" : "Savol arxivdan qaytarildi",
  };
}

/** Nusxa: tahrirlash uchun (takroriylik tekshirilmaydi, matn oxiriga belgi qo'shiladi) */
export async function duplicateBankQuestion(
  questionId: string,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(questionId);
  const q = await db.bankQuestion.findFirst({
    where: { id, ownerId: user.id },
    select: {
      topicId: true,
      text: true,
      type: true,
      difficulty: true,
      points: true,
      explanation: true,
      tags: true,
      options: {
        orderBy: { order: "asc" },
        select: { text: true, isCorrect: true, order: true },
      },
    },
  });
  if (!q) return FORBIDDEN;
  const { options, text, ...rest } = q;
  await db.bankQuestion.create({
    data: {
      ...rest,
      ownerId: user.id,
      text: `${text} (nusxa)`.slice(0, 2000),
      options: { create: options },
    },
  });
  revalidateBank();
  return { ok: true, message: "Nusxa yaratildi" };
}

// ---------- Import ----------

export type BankImportPreview =
  { ok: true; questions: ParsedQuestion[] } | { ok: false; error: string };

export async function previewBankImport(
  formData: FormData,
): Promise<BankImportPreview> {
  await requireTeacherScope();
  const result = await parseQuestionFile(formData);
  return "error" in result
    ? { ok: false, error: result.error }
    : { ok: true, questions: result.questions };
}

/** Bo'sh mavzu va qiyinlik ustunlari uchun formadagi qiymatlar (topicId, difficulty) */
export async function importBankQuestions(
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const defaults = z
    .object({ topicId: idSchema, difficulty: difficultySchema })
    .safeParse({
      topicId: formData.get("topicId"),
      difficulty: formData.get("difficulty"),
    });
  if (!defaults.success)
    return { ok: false, error: "Mavzu va qiyinlikni tanlang" };
  if (!(await ownsTopic(user.id, defaults.data.topicId))) return FORBIDDEN;

  // Fayl serverda qayta o'qiladi va tekshiriladi
  const result = await parseQuestionFile(formData);
  if ("error" in result) return { ok: false, error: result.error };
  const items = result.questions.flatMap((q) =>
    q.question
      ? [
          {
            question: q.question,
            topic: q.bank.topic,
            difficulty: parseDifficulty(q.bank.difficulty),
          },
        ]
      : [],
  );
  if (items.length !== result.questions.length)
    return {
      ok: false,
      error: "Savollarda xato bor. Faylni tuzatib, qayta yuklang",
    };
  const { added, skipped } = await importToBank(user.id, items, defaults.data);
  revalidateBank();
  return {
    ok: true,
    message:
      skipped > 0
        ? `${added} ta savol qo'shildi, ${skipped} ta takroriy o'tkazib yuborildi`
        : `${added} ta savol qo'shildi`,
  };
}

// ---------- Test bilan ----------

/** O'qituvchi va test unga tahrirlanadigan bo'lsa */
async function requireBankTest(
  testId: string,
): Promise<{ denied: ActionResult } | { user: CurrentUser; testId: string }> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(testId);
  const access = await getTestAccess(user, id);
  if (!access) return { denied: { ok: false, error: "Test topilmadi" } };
  if (!access.canEdit) return { denied: FORBIDDEN };
  return { user, testId: id };
}

function revalidateTest(testId: string) {
  revalidatePath(`/teacher/tests/${testId}`);
  revalidateBank();
}

/** Testdagi barcha savollarni bankka; takroriylari (bir xil matn va variantlar) qo'shilmaydi */
export async function saveTestQuestionsToBank(
  testId: string,
  input: SaveToBankInput,
): Promise<ActionResult> {
  const ctx = await requireBankTest(testId);
  if ("denied" in ctx) return ctx.denied;
  const parsed = saveToBankSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if (!(await ownsTopic(ctx.user.id, parsed.data.topicId))) return FORBIDDEN;
  const { added, skipped } = await saveTestToBank(
    ctx.user.id,
    ctx.testId,
    parsed.data,
  );
  revalidateBank();
  return {
    ok: true,
    message:
      skipped > 0
        ? `Bankka ${added} ta savol qo'shildi, ${skipped} tasi bankda bor edi`
        : `Bankka ${added} ta savol qo'shildi`,
  };
}

export async function addBankQuestionsToTest(
  testId: string,
  questionIds: string[],
): Promise<ActionResult> {
  const ctx = await requireBankTest(testId);
  if ("denied" in ctx) return ctx.denied;
  const parsed = bankQuestionIdsSchema.safeParse(questionIds);
  if (!parsed.success)
    return { ok: false, error: issueMessages(parsed.error).join(". ") };
  const count = await copyBankToTest(ctx.user.id, ctx.testId, parsed.data);
  if (count === "FORBIDDEN") return FORBIDDEN;
  revalidateTest(ctx.testId);
  return { ok: true, message: `Testga ${count} ta savol qo'shildi` };
}

export type PickPreview =
  | {
      ok: true;
      picked: PickPreviewItem[][];
      shortages: { rule: number; missing: number }[];
    }
  | { ok: false; error: string };

/** Avtomatik yig'ish: faqat ko'rsatadi, saqlash — addBankQuestionsToTest */
export async function previewBankPick(
  testId: string,
  input: PickInput,
): Promise<PickPreview> {
  const ctx = await requireBankTest(testId);
  if ("denied" in ctx) return { ok: false, error: errorOf(ctx.denied) };
  const parsed = pickInputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: issueMessages(parsed.error).join(". ") };
  const result = await pickFromBank(ctx.user.id, ctx.testId, parsed.data);
  if (result === "FORBIDDEN") return { ok: false, error: errorOf(FORBIDDEN) };
  return { ok: true, ...result };
}

export async function replaceBankPick(
  testId: string,
  input: {
    rule: { topicId: string; difficulty: Difficulty | null };
    selected: string[];
    excludeUsed: boolean;
  },
): Promise<
  { ok: true; item: PickPreviewItem | null } | { ok: false; error: string }
> {
  const ctx = await requireBankTest(testId);
  if ("denied" in ctx) return { ok: false, error: errorOf(ctx.denied) };
  const parsed = z
    .object({
      rule: z.object({
        topicId: idSchema,
        difficulty: difficultySchema.nullable(),
      }),
      selected: z.array(idSchema).max(500),
      excludeUsed: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ma'lumot noto'g'ri" };
  const item = await pickOneReplacement(ctx.user.id, ctx.testId, parsed.data);
  if (item === "FORBIDDEN") return { ok: false, error: errorOf(FORBIDDEN) };
  return { ok: true, item };
}
