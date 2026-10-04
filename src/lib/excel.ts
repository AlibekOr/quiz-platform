import "server-only";
import ExcelJS from "exceljs";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Yuklangan faylni FormData'dan oladi va hajm/turini tekshiradi */
export function getUploadedFile(
  formData: FormData,
  allowed: readonly ("xlsx" | "json")[],
): { file: File; kind: "xlsx" | "json" } | { error: string } {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Fayl tanlanmagan" };
  if (file.size > MAX_UPLOAD_BYTES)
    return { error: "Fayl hajmi 2MB dan oshmasin" };

  const name = file.name.toLowerCase();
  const kind =
    name.endsWith(".xlsx") || file.type === XLSX_MIME
      ? "xlsx"
      : name.endsWith(".json")
        ? "json"
        : null;
  if (!kind || !allowed.includes(kind)) {
    return {
      error: `Faqat ${allowed.map((k) => "." + k).join(" yoki ")} fayl qabul qilinadi`,
    };
  }
  return { file, kind };
}

/** exceljs katak qiymatini oddiy qiymatga aylantiradi (rich text, formula, hyperlink) */
function cellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date || typeof value !== "object") return value;
  if ("richText" in value) return value.richText.map((r) => r.text).join("");
  if ("result" in value) return cellValue(value.result as ExcelJS.CellValue);
  if ("text" in value) return value.text;
  if ("error" in value) return null;
  return null;
}

/** Birinchi varaqni qatorlar massiviga aylantiradi (bo'sh kataklar null) */
export async function readFirstSheet(
  file: File,
): Promise<unknown[][] | { error: string }> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return {
      error: "Faylni o'qib bo'lmadi. .xlsx formatidagi Excel fayl tanlang",
    };
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) return { error: "Faylda varaq yo'q" };

  const rows: unknown[][] = [];
  const width = sheet.columnCount;
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const cells: unknown[] = [];
    for (let c = 1; c <= width; c++)
      cells.push(cellValue(row.getCell(c).value));
    rows[rowNumber - 1] = cells;
  });
  // eachRow oraliqdagi bo'sh qatorlarni o'tkazib yuborishi mumkin — teshiklarni to'ldiramiz
  return Array.from(rows, (r) => r ?? []);
}
