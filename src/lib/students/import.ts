import {
  fullNameSchema,
  groupNameSchema,
  passwordSchema,
  usernameSchema,
} from "@/lib/validators/student";

// Sof funksiyalar: klientda (preview) ham, serverda (yakuniy tekshiruv) ham ishlatiladi

export const IMPORT_COLUMNS = [
  "fullName",
  "username",
  "password",
  "group",
] as const;
export const MAX_IMPORT_ROWS = 500;

export type ImportRow = {
  fullName: string;
  username: string;
  password: string;
  group: string;
};

export type ValidatedRow = ImportRow & {
  /** Excel'dagi qator raqami (sarlavha 1-qator) */
  line: number;
  errors: string[];
};

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return String(cell).trim();
}

/**
 * Jadvalni (birinchi qator — sarlavha) qatorlarga aylantiradi.
 * Ustunlar tartibi muhim emas, sarlavhalar katta-kichik harfga sezgir emas.
 */
export function sheetToRows(
  sheet: readonly (readonly unknown[])[],
): { rows: (ImportRow & { line: number })[] } | { error: string } {
  if (sheet.length === 0) return { error: "Fayl bo'sh" };

  const header = sheet[0].map((c) => cellToString(c).toLowerCase());
  const index: Record<string, number> = {};
  for (const column of IMPORT_COLUMNS) {
    const i = header.indexOf(column.toLowerCase());
    if (i === -1) {
      return {
        error: `"${column}" ustuni topilmadi. Kerakli ustunlar: ${IMPORT_COLUMNS.join(" | ")}`,
      };
    }
    index[column] = i;
  }

  const rows: (ImportRow & { line: number })[] = [];
  sheet.slice(1).forEach((cells, i) => {
    const row = {
      fullName: cellToString(cells[index.fullName]),
      username: cellToString(cells[index.username]),
      password: cellToString(cells[index.password]),
      group: cellToString(cells[index.group]),
    };
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

/**
 * Har bir qatorni tekshiradi: maydonlar, fayl ichidagi takror loginlar,
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

    return { ...row, errors };
  });
}
