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

/** Semestr: qoidalar shablondan nusxalanadi (yaratishda templateId majburiy — serverda) */
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
    /** Faqat yaratishda: qaysi shablondan */
    templateId: z
      .string()
      .max(64)
      .nullish()
      .transform((v) => v || null),
  })
  .superRefine((s, ctx) => {
    if (s.endDate < s.startDate)
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Tugash sanasi boshlanishdan oldin bo'lmasin",
      });
  });
export type SemesterInput = z.input<typeof semesterSchema>;

export const GRADE_KIND_VALUES = [
  "HOMEWORK",
  "PRACTICAL",
  "ASSIGNMENT",
  "ORAL",
  "EXTRA",
  "BONUS",
] as const;

/** Bir shablonda bittadan bo'ladigan turlar */
const SINGLE_KIND_VALUES: readonly string[] = [
  "HOMEWORK",
  "PRACTICAL",
  "ORAL",
  "EXTRA",
  "BONUS",
];

const decimalField = (min: number, max: number) =>
  z
    .number({ error: "Son kiriting" })
    .min(min, `Kamida ${min}`)
    .max(max, `Ko'pi bilan ${max}`)
    .refine((v) => Number.isInteger(v * 2), "Butun son yoki .5");

export const categorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nomini kiriting")
      .max(40, "40 belgidan oshmasin"),
    kind: z.enum(GRADE_KIND_VALUES, { error: "Turini tanlang" }),
    /** null — chegarasiz */
    cap: decimalField(0, 1000).nullable(),
    itemMin: decimalField(0, 100),
    /** Topshiriq maksimal bali butun son (Assignment.maxPoints) */
    itemMax: intField(1, 100),
    step: z
      .number({ error: "Qadamni tanlang" })
      .refine((v) => v === 0.5 || v === 1, "Qadam 0,5 yoki 1"),
  })
  .superRefine((c, ctx) => {
    if (c.itemMin > c.itemMax)
      ctx.addIssue({
        code: "custom",
        path: ["itemMin"],
        message: "Eng kam ball eng ko'pdan katta bo'lmasin",
      });
    // Og'zaki davomat varag'ida 0 / 0,5 / 1 tugmalari bilan qo'yiladi
    if (c.kind === "ORAL" && (c.itemMin !== 0 || c.itemMax !== 1 || c.step !== 0.5))
      ctx.addIssue({
        code: "custom",
        path: ["itemMax"],
        message: "Og'zaki: har darsda 0 / 0,5 / 1",
      });
    if (!Number.isInteger((c.itemMax - c.itemMin) / c.step))
      ctx.addIssue({
        code: "custom",
        path: ["step"],
        message: "Oraliq qadamga bo'linsin",
      });
  });

/** Baholash shabloni (ROLES.md §5): failBelow < o'tish bali <= maxTotal */
export const templateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nomini kiriting")
      .max(60, "Nom 60 belgidan oshmasin"),
    maxTotal: intField(1, 1000),
    passPercent: intField(1, 100),
    failBelow: intField(0, 1000),
    extraMode: z.enum(["ANYTIME", "AFTER_END_BAND"]),
    extraBeyondMax: z.boolean(),
    isDefault: z.boolean(),
    categories: z
      .array(categorySchema)
      .min(1, "Kamida bitta kategoriya")
      .max(20, "Ko'pi bilan 20 ta kategoriya"),
  })
  .superRefine((t, ctx) => {
    if (t.failBelow >= (t.maxTotal * t.passPercent) / 100)
      ctx.addIssue({
        code: "custom",
        path: ["failBelow"],
        message: "O'tish balidan kichik bo'lsin",
      });
    const names = new Set<string>();
    const kinds = new Set<string>();
    t.categories.forEach((c, i) => {
      const key = c.name.trim().toLowerCase();
      if (names.has(key))
        ctx.addIssue({
          code: "custom",
          path: ["categories", i, "name"],
          message: "Nom takrorlanmasin",
        });
      names.add(key);
      if (SINGLE_KIND_VALUES.includes(c.kind) && kinds.has(c.kind))
        ctx.addIssue({
          code: "custom",
          path: ["categories", i, "kind"],
          message: "Bu turdan bitta bo'ladi",
        });
      kinds.add(c.kind);
    });
  });
export type TemplateInput = z.input<typeof templateSchema>;
export type TemplateData = z.output<typeof templateSchema>;

/** Kategoriya — semestr kategoriyasi (turi undan olinadi). Uyga vazifada maxPoints — kategoriyaniki */
export const assignmentSchema = z.object({
  semesterId: selectedId("Semestrni tanlang"),
  categoryId: selectedId("Kategoriyani tanlang"),
  /** Qaysi darsda berilgan (ixtiyoriy) — dars semestr guruhida bo'lishi serverda tekshiriladi */
  lessonId: z
    .string()
    .max(64)
    .nullish()
    .transform((v) => v || null),
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
