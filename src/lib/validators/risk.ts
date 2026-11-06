import { z } from "zod";

// Xavf ostidagi o'quvchilar (FEATURES.md, A qism)

export const reviewSchema = z.object({
  note: z
    .string()
    .trim()
    .max(300, "300 belgidan oshmasin")
    .nullish()
    .transform((v) => v || null),
  /** Ro'yxatda necha kun kulrang va pastda turadi */
  days: z
    .number({ error: "Son kiriting" })
    .int()
    .min(1, "Kamida 1 kun")
    .max(60, "Ko'pi bilan 60 kun"),
});
export type ReviewInput = z.input<typeof reviewSchema>;

const int = (min: number, max: number) =>
  z
    .number({ error: "Son kiriting" })
    .int("Butun son")
    .min(min, `Kamida ${min}`)
    .max(max, `Ko'pi bilan ${max}`);

export const riskSettingsSchema = z.object({
  absencesEnabled: z.boolean(),
  absencesMin: int(1, 20),
  attendanceEnabled: z.boolean(),
  attendanceBelow: int(1, 100),
  attendanceMinLessons: int(1, 50),
  missedEnabled: z.boolean(),
  missedLastN: int(1, 20),
  missedMin: int(1, 20),
  paceEnabled: z.boolean(),
  /** Kutilgan ballning qismi (0,8 = 80%) */
  paceRatio: z.number({ error: "Son kiriting" }).min(0.1).max(1),
  paceGraceDays: int(0, 120),
  paceHighAfter: z.number({ error: "Son kiriting" }).min(0).max(1),
  penaltiesEnabled: z.boolean(),
  penaltiesWindowDays: int(1, 180),
  penaltiesMin: z.number({ error: "Son kiriting" }).min(0.5).max(100),
});
export type RiskSettingsInput = z.input<typeof riskSettingsSchema>;
