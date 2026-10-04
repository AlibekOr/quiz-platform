import { z } from "zod";

export const MAX_OPTIONS = 10;

export const optionInputSchema = z.object({
  id: z.string().optional(),
  text: z
    .string()
    .trim()
    .min(1, "Variant matni bo'sh")
    .max(500, "Variant 500 belgidan oshmasin"),
  isCorrect: z.boolean(),
});

export const questionInputSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "Savol matnini kiriting")
      .max(2000, "Savol 2000 belgidan oshmasin"),
    type: z.enum(["SINGLE", "MULTIPLE"], {
      error: "Turi SINGLE yoki MULTIPLE bo'lsin",
    }),
    points: z
      .number({ error: "Ball son bo'lsin" })
      .int("Ball butun son bo'lsin")
      .min(1, "Ball kamida 1")
      .max(100, "Ball 100 dan oshmasin"),
    options: z
      .array(optionInputSchema)
      .max(MAX_OPTIONS, `Ko'pi bilan ${MAX_OPTIONS} ta variant`),
  })
  .superRefine((q, ctx) => {
    if (q.options.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Kamida 2 ta variant kerak",
      });
    }
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (correct === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Kamida 1 ta to'g'ri javob belgilang",
      });
    } else if (q.type === "SINGLE" && correct !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "SINGLE savolda aynan 1 ta to'g'ri javob bo'ladi",
      });
    }
    const texts = q.options.map((o) => o.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Variantlar takrorlanmasin",
      });
    }
  });

export type QuestionInput = z.infer<typeof questionInputSchema>;

export const testSettingsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Test nomini kiriting")
    .max(200, "Nom 200 belgidan oshmasin"),
  description: z
    .string()
    .trim()
    .max(2000, "Tavsif 2000 belgidan oshmasin")
    .transform((v) => v || null),
  durationMin: z.coerce
    .number({ error: "Vaqt son bo'lsin" })
    .int("Vaqt butun son bo'lsin")
    .min(1, "Vaqt kamida 1 daqiqa")
    .max(300, "Vaqt 300 daqiqadan oshmasin"),
  allowRetake: z.boolean(),
  showAnswers: z.boolean(),
  shuffleQuestions: z.boolean(),
  groupIds: z.array(z.string().min(1)).max(200),
});

export type TestSettingsInput = z.infer<typeof testSettingsSchema>;

/** Zod xatolaridan birinchi xabarlar ro'yxati (takrorsiz) */
export function issueMessages(error: z.ZodError): string[] {
  return [...new Set(error.issues.map((i) => i.message))];
}
