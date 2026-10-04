import { z } from "zod";

// Telefon va Telegram: kiritilgan har xil yozuvlarni bitta formatga keltiradi (PLAN.md, 3-bosqich)

const PHONE_HINT = "Telefon raqami noto'g'ri. Masalan: 90 123 45 67";

/** "90 123 45 67", "901234567", "+998 90 ...", "998901234567" -> "+998901234567"; noto'g'ri bo'lsa null */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  const plain = digits.replace(/^\+/, "");
  if (/^998\d{9}$/.test(plain)) return `+${plain}`;
  if (!digits.startsWith("+") && /^\d{9}$/.test(plain)) return `+998${plain}`;
  return null;
}

/** "@user", "user", "t.me/user", "https://t.me/user" -> "@user"; telefon -> "+998..."; noto'g'ri bo'lsa null */
export function normalizeTelegram(input: string): string | null {
  const value = input.trim();
  const phone = normalizePhone(value);
  if (phone) return phone;
  const username = value
    .replace(/^(https?:\/\/)?(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "");
  // Telegram username: 5–32 belgi, harf bilan boshlanadi, harf/raqam/_
  return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(username) ? `@${username}` : null;
}

/** Telegram qiymatidan havola: @user -> t.me/user, telefon -> t.me/+998... */
export function telegramUrl(telegram: string): string {
  return telegram.startsWith("@")
    ? `https://t.me/${telegram.slice(1)}`
    : `https://t.me/${telegram}`;
}

/** Ixtiyoriy matn: bo'sh qator -> null */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullish()
    .transform((v) => v || null);

export const optionalPhoneSchema = z
  .string()
  .nullish()
  .transform((v, ctx) => {
    if (!v?.trim()) return null;
    const phone = normalizePhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: PHONE_HINT });
      return z.NEVER;
    }
    return phone;
  });

export const optionalTelegramSchema = z
  .string()
  .nullish()
  .transform((v, ctx) => {
    if (!v?.trim()) return null;
    const telegram = normalizeTelegram(v);
    if (!telegram) {
      ctx.addIssue({
        code: "custom",
        message: "Telegram: @username yoki telefon raqami",
      });
      return z.NEVER;
    }
    return telegram;
  });

export const PARENT_RELATIONS = ["FATHER", "MOTHER", "OTHER"] as const;
export type ParentRelation = (typeof PARENT_RELATIONS)[number];

export const PARENT_RELATION_LABELS: Record<ParentRelation, string> = {
  FATHER: "Ota",
  MOTHER: "Ona",
  OTHER: "Boshqa",
};

/** Excel'dan: "ota" / "ona" / "boshqa" yoki FATHER / MOTHER / OTHER */
export function parseParentRelation(input: string): ParentRelation | null {
  const value = input.trim().toLowerCase();
  if (value === "") return null;
  const found = PARENT_RELATIONS.find(
    (r) =>
      r.toLowerCase() === value ||
      PARENT_RELATION_LABELS[r].toLowerCase() === value,
  );
  return found ?? null;
}

export const studentProfileSchema = z.object({
  phone: optionalPhoneSchema,
  telegram: optionalTelegramSchema,
  parentName: optionalText(100, "Ism 100 belgidan oshmasin"),
  parentRelation: z
    .enum(PARENT_RELATIONS)
    .or(z.literal(""))
    .nullish()
    .transform((v) => v || null),
  parentPhone: optionalPhoneSchema,
  note: optionalText(1000, "Izoh 1000 belgidan oshmasin"),
});

export type StudentProfileInput = z.input<typeof studentProfileSchema>;
export type StudentProfileData = z.output<typeof studentProfileSchema>;

export const EMPTY_PROFILE: StudentProfileInput = {
  phone: "",
  telegram: "",
  parentName: "",
  parentRelation: "",
  parentPhone: "",
  note: "",
};
