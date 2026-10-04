import {
  normalizePhone,
  normalizeTelegram,
  parseParentRelation,
  type StudentProfileData,
} from "@/lib/validators/contact";
import {
  fullNameSchema,
  groupNameSchema,
  passwordSchema,
  usernameSchema,
} from "@/lib/validators/student";

// Sof funksiyalar: server faylni o'qigach shu yerda tekshiriladi (testlar bilan)

export const REQUIRED_COLUMNS = [
  "fullName",
  "username",
  "password",
  "group",
] as const;
export const OPTIONAL_COLUMNS = [
  "phone",
  "telegram",
  "parentName",
  "parentRelation",
  "parentPhone",
] as const;
export const IMPORT_COLUMNS = [
  ...REQUIRED_COLUMNS,
  ...OPTIONAL_COLUMNS,
] as const;
export const MAX_IMPORT_ROWS = 500;

type Column = (typeof IMPORT_COLUMNS)[number];

export type ImportRow = Record<Column, string>;

export type ValidatedRow = ImportRow & {
  /** Excel'dagi qator raqami (sarlavha 1-qator) */
  line: number;
  errors: string[];
  /** Normallashgan aloqa ma'lumotlari (xato bo'lmasa) */
  profile: StudentProfileData;
};

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return String(cell).trim();
}

/**
 * Jadvalni (birinchi qator — sarlavha) qatorlarga aylantiradi.
 * Ustunlar tartibi muhim emas, sarlavhalar katta-kichik harfga sezgir emas.
 * Aloqa ustunlari ixtiyoriy — eski formatdagi fayllar ham o'qiladi.
 */
export function sheetToRows(
  sheet: readonly (readonly unknown[])[],
): { rows: (ImportRow & { line: number })[] } | { error: string } {
  if (sheet.length === 0) return { error: "Fayl bo'sh" };

  const header = sheet[0].map((c) => cellToString(c).toLowerCase());
  const index = {} as Record<Column, number>;
  for (const column of IMPORT_COLUMNS) {
    const i = header.indexOf(column.toLowerCase());
    if (i === -1 && (REQUIRED_COLUMNS as readonly string[]).includes(column)) {
      return {
        error: `"${column}" ustuni topilmadi. Majburiy ustunlar: ${REQUIRED_COLUMNS.join(" | ")}`,
      };
    }
    index[column] = i;
  }

  const rows: (ImportRow & { line: number })[] = [];
  sheet.slice(1).forEach((cells, i) => {
    const row = Object.fromEntries(
      IMPORT_COLUMNS.map((c) => [
        c,
        index[c] === -1 ? "" : cellToString(cells[index[c]]),
      ]),
    ) as ImportRow;
    if (Object.values(row).every((v) => v === "")) return;
    rows.push({ ...row, line: i + 2 });
  });

  if (rows.length === 0) return { error: "Faylda o'quvchilar yo'q" };
  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      error: `Bir martada ko'pi bilan ${MAX_IMPORT_ROWS} ta o'quvchi import qilinadi`,
    };
  }
  return { rows };
}

function firstError(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.success
    ? null
    : (result.error?.issues[0]?.message ?? "Noto'g'ri qiymat");
}

/** Aloqa ustunlarini normallashtiradi va xatolarini yig'adi */
function parseProfile(row: ImportRow, errors: string[]): StudentProfileData {
  const phone = row.phone ? normalizePhone(row.phone) : null;
  if (row.phone && !phone)
    errors.push(`phone: "${row.phone}" — telefon raqami noto'g'ri`);

  const telegram = row.telegram ? normalizeTelegram(row.telegram) : null;
  if (row.telegram && !telegram)
    errors.push(`telegram: "${row.telegram}" — @username yoki telefon bo'lsin`);

  const parentPhone = row.parentPhone ? normalizePhone(row.parentPhone) : null;
  if (row.parentPhone && !parentPhone)
    errors.push(`parentPhone: "${row.parentPhone}" — telefon raqami noto'g'ri`);

  const parentRelation = parseParentRelation(row.parentRelation);
  if (row.parentRelation && !parentRelation)
    errors.push("parentRelation: ota, ona yoki boshqa bo'lsin");

  if (row.parentName.length > 100)
    errors.push("parentName 100 belgidan oshmasin");

  return {
    phone,
    telegram,
    parentName: row.parentName || null,
    parentRelation,
    parentPhone,
    note: null,
  };
}

/**
 * Har bir qatorni tekshiradi: maydonlar, aloqa ma'lumotlari, fayl ichidagi takror loginlar,
 * bazada bor loginlar va mavjud bo'lmagan guruhlar.
 */
export function validateImportRows(
  rows: (ImportRow & { line: number })[],
  context: { existingUsernames: Set<string>; groupNames: Set<string> },
): ValidatedRow[] {
  const existing = new Set(
    [...context.existingUsernames].map((u) => u.toLowerCase()),
  );
  const groups = new Set([...context.groupNames].map((g) => g.toLowerCase()));

  const seen = new Map<string, number>();
  for (const row of rows) {
    const key = row.username.toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }

  return rows.map((row) => {
    const errors: string[] = [];
    const checks = [
      firstError(fullNameSchema.safeParse(row.fullName)),
      firstError(usernameSchema.safeParse(row.username)),
      firstError(passwordSchema.safeParse(row.password)),
      firstError(groupNameSchema.safeParse(row.group)),
    ];
    for (const message of checks) if (message) errors.push(message);

    const key = row.username.toLowerCase();
    if (row.username && (seen.get(key) ?? 0) > 1)
      errors.push("Login faylda takrorlangan");
    if (row.username && existing.has(key))
      errors.push("Bunday login allaqachon mavjud");
    if (row.group && !groups.has(row.group.toLowerCase()))
      errors.push(`"${row.group}" guruhi topilmadi`);

    const profile = parseProfile(row, errors);
    return { ...row, errors, profile };
  });
}
