import { z } from "zod";
import { fullNameSchema, passwordSchema, usernameSchema } from "./student";

// Menejerlar, regionlar va o'chirish so'rovlari (PLAN.md, 13-bosqich)

/** Select'dan: "" — tanlanmagan (null) */
const optionalId = z
  .string()
  .max(64)
  .transform((v) => v || null);

export const regionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Region nomini kiriting")
    .max(60, "Nom 60 belgidan oshmasin"),
});
export type RegionInput = z.input<typeof regionSchema>;

export const managerUpdateSchema = z.object({
  fullName: fullNameSchema,
  username: usernameSchema,
  regionId: optionalId,
});
export type ManagerUpdateInput = z.input<typeof managerUpdateSchema>;

export const managerCreateSchema = managerUpdateSchema.extend({
  password: passwordSchema,
});
export type ManagerCreateInput = z.input<typeof managerCreateSchema>;

/** Qo'shimcha biriktirilgan guruhlar (regiondan tashqari) — to'liq ro'yxat */
export const managerGroupsSchema = z.object({
  groupIds: z.array(z.string().min(1).max(64)).max(500),
});
export type ManagerGroupsInput = z.input<typeof managerGroupsSchema>;

export const groupRegionSchema = z.object({ regionId: optionalId });

export const deletionRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Sababini yozing")
    .max(500, "500 belgidan oshmasin"),
});
export type DeletionRequestInput = z.input<typeof deletionRequestSchema>;

export const deletionDecisionSchema = z.object({
  approve: z.boolean(),
  note: z
    .string()
    .trim()
    .max(500, "500 belgidan oshmasin")
    .nullish()
    .transform((v) => v || null),
});
export type DeletionDecisionInput = z.input<typeof deletionDecisionSchema>;
