import { z } from "zod";
import { isValidDateStr } from "@/lib/time";

// Uyga vazifalar va baholar (PLAN.md, 12-bosqich)

const idSchema = z.string().min(1).max(64);

const dateSchema = z
  .string()
  .refine(isValidDateStr, "Sanani tanlang (YYYY-MM-DD)");

const reasonSchema = z
  .string()
  .trim()
  .min(1, "Sababini yozing")
  .max(300, "300 belgidan oshmasin");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} belgidan oshmasin`)
    .nullish()
    .transform((v) => v || null);

/** Select'dan keladigan id: bo'sh bo'lsa — tanlanmagan */
const selectedId = (message: string) =>
  z
    .string()
    .max(64)
    .refine((v) => v !== "", message);

export const periodSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nomini kiriting")
      .max(60, "Nom 60 belgidan oshmasin"),
    startDate: dateSchema,
    endDate: dateSchema,
    passPercent: z
      .number({ error: "Son kiriting" })
      .int("Butun son bo'lsin")
      .min(1, "Kamida 1%")
      .max(100, "Ko'pi bilan 100%"),
  })
  .refine((p) => p.endDate >= p.startDate, {
    path: ["endDate"],
    message: "Tugash sanasi boshlanishdan oldin bo'lmasin",
  });
export type PeriodInput = z.input<typeof periodSchema>;

export const homeworkSchema = z.object({
  periodId: selectedId("Davrni tanlang"),
  title: z
    .string()
    .trim()
    .min(1, "Nomini kiriting")
    .max(200, "Nom 200 belgidan oshmasin"),
  description: optionalText(2000),
  dueDate: dateSchema,
  maxPoints: z
    .number({ error: "Son kiriting" })
    .int("Butun son bo'lsin")
    .min(1, "Kamida 1")
    .max(1000, "Ko'pi bilan 1000"),
});
export type HomeworkInput = z.input<typeof homeworkSchema>;

/** Ball qo'yish: bo'sh qator — baho o'chiriladi. Ball maxPoints bilan serverda solishtiriladi */
export const homeworkGradesSchema = z.object({
  grades: z
    .array(
      z.object({
        studentId: idSchema,
        points: z
          .string()
          .trim()
          .refine((v) => v === "" || /^\d{1,4}$/.test(v), "Butun son kiriting"),
        note: optionalText(300),
      }),
    )
    .max(500),
});
export type HomeworkGradesInput = z.input<typeof homeworkGradesSchema>;

/** Test muddati va guruh davrlariga biriktirish (har davrga bal bilan) */
export const testGradingSchema = z.object({
  dueDate: dateSchema.or(z.literal("")).transform((v) => v || null),
  links: z
    .array(
      z.object({
        periodId: idSchema,
        points: z
          .number({ error: "Son kiriting" })
          .int("Butun son bo'lsin")
          .min(1, "Kamida 1")
          .max(1000, "Ko'pi bilan 1000"),
      }),
    )
    .max(100)
    .refine(
      (links) => new Set(links.map((l) => l.periodId)).size === links.length,
      "Bir davr ikki marta tanlangan",
    ),
});
export type TestGradingInput = z.input<typeof testGradingSchema>;

export const adjustmentSchema = z.object({
  periodId: selectedId("Davrni tanlang"),
  points: z
    .number({ error: "Son kiriting" })
    .int("Butun son bo'lsin")
    .min(-1000, "Kamida -1000")
    .max(1000, "Ko'pi bilan 1000")
    .refine((v) => v !== 0, "0 bo'lmasin"),
  reason: reasonSchema,
});
export type AdjustmentInput = z.input<typeof adjustmentSchema>;

/** item: "HOMEWORK:<id>" yoki "TEST:<id>" (lib/grades.ts itemKey) */
export const exemptionSchema = z.object({
  item: z
    .string()
    .regex(/^(HOMEWORK|TEST):[^:]{1,64}$/, "Vazifa yoki testni tanlang"),
  reason: reasonSchema,
});
export type ExemptionInput = z.input<typeof exemptionSchema>;

export function parseItemKey(key: string): {
  itemType: "HOMEWORK" | "TEST";
  itemId: string;
} {
  const [itemType, itemId] = key.split(":") as ["HOMEWORK" | "TEST", string];
  return { itemType, itemId };
}
