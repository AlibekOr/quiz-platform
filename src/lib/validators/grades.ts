import { z } from "zod";
import { isValidDateStr } from "@/lib/time";

// Semestr ball tizimi (PLAN.md, 17-bosqich)

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

const intField = (min: number, max: number) =>
  z
    .number({ error: "Son kiriting" })
    .int("Butun son bo'lsin")
    .min(min, `Kamida ${min}`)
    .max(max, `Ko'pi bilan ${max}`);

export const semesterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nomini kiriting")
      .max(60, "Nom 60 belgidan oshmasin"),
    startDate: dateSchema,
    endDate: dateSchema,
    closed: z.boolean(),
    maxTotal: intField(1, 1000),
    passPercent: intField(1, 100),
    failBelow: intField(0, 1000),
    homeworkCap: intField(0, 1000),
    practicalCap: intField(0, 1000),
    oralCap: intField(0, 1000),
    extraCap: intField(0, 1000),
  })
  .superRefine((s, ctx) => {
    if (s.endDate < s.startDate)
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Tugash sanasi boshlanishdan oldin bo'lmasin",
      });
    if (s.failBelow > (s.maxTotal * s.passPercent) / 100)
      ctx.addIssue({
        code: "custom",
        path: ["failBelow"],
        message: "O'tish balidan katta bo'lmasin",
      });
  });
export type SemesterInput = z.input<typeof semesterSchema>;

export const ASSIGNMENT_CATEGORY_VALUES = [
  "HOMEWORK",
  "PRACTICAL",
  "EXTRA",
  "BONUS",
] as const;

/** HOMEWORK uchun maxPoints doim 1 — server o'zi qo'yadi */
export const assignmentSchema = z.object({
  semesterId: selectedId("Semestrni tanlang"),
  category: z.enum(ASSIGNMENT_CATEGORY_VALUES, {
    error: "Turini tanlang",
  }),
  title: z
    .string()
    .trim()
    .min(1, "Nomini kiriting")
    .max(200, "Nom 200 belgidan oshmasin"),
  description: optionalText(2000),
  dueDate: dateSchema,
  maxPoints: intField(1, 100),
});
export type AssignmentInput = z.input<typeof assignmentSchema>;

/**
 * Ball matni: "" (baho o'chiriladi), "1", "0.5" yoki "0,5". Ruxsat etilgan qiymat
 * (0 / 0.5 / 1 yoki 0..maxPoints) serverda kategoriya bo'yicha tekshiriladi
 */
const pointsText = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d{1,3}([.,]5|[.,]0)?$/.test(v),
    "Ball: butun son yoki .5",
  )
  .transform((v) => (v === "" ? null : Number(v.replace(",", "."))));

export const assignmentGradesSchema = z.object({
  grades: z
    .array(
      z.object({
        studentId: idSchema,
        points: pointsText,
        note: optionalText(300),
      }),
    )
    .max(500),
});
export type AssignmentGradesInput = z.input<typeof assignmentGradesSchema>;

/** Og'zaki ballar (dars sahifasida): bo'sh — o'chiriladi, aks holda 0 / 0.5 / 1 */
export const oralScoresSchema = z.object({
  scores: z
    .array(
      z.object({
        studentId: idSchema,
        points: z
          .enum(["", "0", "0.5", "1"], { error: "0, 0.5 yoki 1" })
          .transform((v) => (v === "" ? null : Number(v))),
      }),
    )
    .max(500),
});
export type OralScoresInput = z.input<typeof oralScoresSchema>;

export const adjustmentSchema = z.object({
  semesterId: selectedId("Semestrni tanlang"),
  points: z
    .number({ error: "Son kiriting" })
    .min(-1000, "Kamida -1000")
    .max(1000, "Ko'pi bilan 1000")
    .refine((v) => Number.isInteger(v * 2), "Butun son yoki .5")
    .refine((v) => v !== 0, "0 bo'lmasin"),
  reason: reasonSchema,
});
export type AdjustmentInput = z.input<typeof adjustmentSchema>;
