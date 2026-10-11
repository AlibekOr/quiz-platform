import { z } from "zod";
import { isValidDateStr } from "@/lib/time";

// Jarima shablonlari va jarimalar (TASKS.md, 5-bo'lim)

const idSchema = z.string().min(1).max(64);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} belgidan oshmasin`)
    .nullish()
    .transform((v) => v || null);

/** Jarima bali: musbat, 0.5 qadam (jamidan ayiriladi) */
const pointsSchema = z
  .number({ error: "Son kiriting" })
  .min(0.5, "Kamida 0.5")
  .max(60, "Ko'pi bilan 60")
  .refine((v) => Number.isInteger(v * 2), "Butun son yoki .5");

export const penaltyTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nomini kiriting")
    .max(100, "Nom 100 belgidan oshmasin"),
  defaultPoints: pointsSchema,
  description: optionalText(300),
  isActive: z.boolean(),
});
export type PenaltyTypeInput = z.input<typeof penaltyTypeSchema>;

export const applyPenaltySchema = z.object({
  semesterId: idSchema,
  typeId: idSchema,
  studentIds: z
    .array(idSchema)
    .min(1, "Kamida bitta o'quvchini tanlang")
    .max(300),
  /** Bo'sh — shablondagi ball */
  points: pointsSchema.nullish().transform((v) => v ?? null),
  note: optionalText(300),
  date: z.string().refine(isValidDateStr, "Sana noto'g'ri"),
});
export type ApplyPenaltyInput = z.input<typeof applyPenaltySchema>;
export type ApplyPenaltyData = z.output<typeof applyPenaltySchema>;
