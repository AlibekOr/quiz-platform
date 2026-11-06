import { z } from "zod";
import type { Difficulty } from "@/lib/bank";
import { checkQuestionOptions, questionFields } from "@/lib/validators/test";

// Savollar banki (FEATURES.md, B qism)

const idSchema = z.string().min(1).max(64);

export const MAX_TAGS = 10;

export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"], {
  error: "Qiyinlikni tanlang",
});

export const topicInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Mavzu nomini kiriting")
    .max(100, "Nom 100 belgidan oshmasin"),
  parentId: idSchema.nullable(),
});
export type TopicInput = z.input<typeof topicInputSchema>;

/** "flex, CSS  ,flex" → ["flex", "CSS"] (takrorsiz, bo'shlari tashlanadi) */
export function parseTags(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of value.split(",")) {
    const tag = raw.trim().replace(/\s+/g, " ");
    if (tag === "" || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  }
  return tags;
}

/** Import ustuni: EASY/MEDIUM/HARD yoki oson/o'rta/qiyin; bo'sh yoki noma'lum — null */
export function parseDifficulty(value: string): Difficulty | null {
  const v = value
    .trim()
    .toLowerCase()
    .replace(/[ʻʼ‘’`']/g, "");
  if (v === "easy" || v === "oson") return "EASY";
  if (v === "medium" || v === "orta") return "MEDIUM";
  if (v === "hard" || v === "qiyin") return "HARD";
  return null;
}

export const bankQuestionInputSchema = z
  .object({
    ...questionFields,
    topicId: idSchema,
    difficulty: difficultySchema,
    explanation: z
      .string()
      .trim()
      .max(2000, "Izoh 2000 belgidan oshmasin")
      .nullable()
      .transform((v) => v || null),
    tags: z
      .array(z.string().trim().min(1).max(30, "Teg 30 belgidan oshmasin"))
      .max(MAX_TAGS, `Ko'pi bilan ${MAX_TAGS} ta teg`),
  })
  .superRefine(checkQuestionOptions);
export type BankQuestionInput = z.input<typeof bankQuestionInputSchema>;

/** Forma: bo'sh variantlar tashlanadi, teglar vergul bilan bitta qatorda */
export const bankQuestionFormSchema = z
  .object({
    text: z.string(),
    type: z.enum(["SINGLE", "MULTIPLE"]),
    points: z.number({ error: "Ball son bo'lsin" }),
    options: z.array(z.object({ text: z.string(), isCorrect: z.boolean() })),
    topicId: z.string().min(1, "Mavzuni tanlang"),
    difficulty: difficultySchema,
    explanation: z.string(),
    tags: z.string(),
  })
  .transform((q) => ({
    ...q,
    options: q.options.filter((o) => o.text.trim() !== ""),
    explanation: q.explanation.trim() || null,
    tags: parseTags(q.tags),
  }))
  .pipe(bankQuestionInputSchema);
export type BankQuestionFormInput = z.input<typeof bankQuestionFormSchema>;

/** Testdagi savollarni bankka saqlash */
export const saveToBankSchema = z.object({
  topicId: z.string().min(1, "Mavzuni tanlang"),
  difficulty: difficultySchema,
});
export type SaveToBankInput = z.input<typeof saveToBankSchema>;

export const bankQuestionIdsSchema = z
  .array(idSchema)
  .min(1, "Kamida bitta savol tanlang")
  .max(200, "Bir martada ko'pi bilan 200 ta savol");

export const MAX_PICK_RULES = 20;

/** Avtomatik yig'ish qoidalari: "CSS Flexbox · O'rta · 5 ta" */
export const pickInputSchema = z.object({
  rules: z
    .array(
      z.object({
        topicId: z.string().min(1, "Mavzuni tanlang"),
        difficulty: difficultySchema.nullable(),
        count: z
          .number({ error: "Son kiriting" })
          .int("Butun son bo'lsin")
          .min(1, "Kamida 1 ta")
          .max(100, "Ko'pi bilan 100 ta"),
      }),
    )
    .min(1, "Kamida bitta qoida qo'shing")
    .max(MAX_PICK_RULES, `Ko'pi bilan ${MAX_PICK_RULES} ta qoida`),
  /** Shu test guruhlaridagi boshqa testlarda ishlatilgan savollar olinmaydi */
  excludeUsed: z.boolean(),
});
export type PickInput = z.input<typeof pickInputSchema>;
