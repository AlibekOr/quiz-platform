import { z } from "zod";
import { isValidDateStr } from "@/lib/time";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const timeSchema = z.string().regex(TIME_RE, "Vaqt HH:MM ko'rinishida bo'lsin");

/** Haftaning 7 kuni: belgilangan kunlar uchun boshlanish/tugash vaqti */
export const scheduleFormSchema = z.object({
  days: z
    .array(
      z.object({
        weekday: z.number().int().min(1).max(7),
        enabled: z.boolean(),
        startTime: z.string(),
        endTime: z.string(),
      }),
    )
    .length(7)
    .superRefine((days, ctx) => {
      days.forEach((d, i) => {
        if (!d.enabled) return;
        for (const key of ["startTime", "endTime"] as const) {
          if (!TIME_RE.test(d[key])) {
            ctx.addIssue({
              code: "custom",
              path: [i, key],
              message: "Vaqtni kiriting (HH:MM)",
            });
          }
        }
        if (
          TIME_RE.test(d.startTime) &&
          TIME_RE.test(d.endTime) &&
          d.endTime <= d.startTime
        ) {
          ctx.addIssue({
            code: "custom",
            path: [i, "endTime"],
            message: "Tugash vaqti boshlanishdan keyin bo'lsin",
          });
        }
      });
    }),
});

export type ScheduleFormInput = z.input<typeof scheduleFormSchema>;

export const scheduleRowSchema = z.object({
  weekday: z.number().int().min(1).max(7),
  startTime: timeSchema,
  endTime: timeSchema,
});

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE"] as const;

export const attendanceFormSchema = z
  .object({
    topic: z
      .string()
      .trim()
      .max(200, "Mavzu 200 belgidan oshmasin")
      .nullable()
      .transform((v) => v || null),
    records: z
      .array(
        z.object({
          studentId: z.string().min(1),
          status: z.enum(ATTENDANCE_STATUSES).or(z.literal("")),
          note: z
            .string()
            .trim()
            .max(200, "Izoh 200 belgidan oshmasin")
            .nullable()
            .transform((v) => v || null),
        }),
      )
      .min(1, "Guruhda o'quvchi yo'q")
      .max(300),
  })
  .superRefine((form, ctx) => {
    const unmarked = form.records.filter((r) => r.status === "").length;
    if (unmarked > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["records"],
        message: `${unmarked} ta o'quvchi belgilanmagan`,
      });
    }
  });

export type AttendanceFormInput = z.input<typeof attendanceFormSchema>;

const dateParam = z
  .string()
  .refine(isValidDateStr, "Sana YYYY-MM-DD ko'rinishida bo'lsin");

/** GET /api/attendance/export query parametrlari */
export const attendanceExportQuerySchema = z
  .object({
    groupId: z.string().trim().min(1).max(64),
    from: dateParam,
    to: dateParam,
  })
  .refine((q) => q.from <= q.to, "from to dan katta bo'lmasin");
