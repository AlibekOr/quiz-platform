import ExcelJS from "exceljs";
import { fileSafe } from "@/lib/format";
import {
  cellText,
  ITEM_TYPE_LABEL,
  signedPoints,
  studentLabel,
  type GradeSheet,
} from "@/lib/grades";
import { formatDate, formatDayMonth, type DateStr } from "@/lib/time";

// Baholar varag'ini Excel'ga eksport (PLAN.md, 12-bosqich)

export const GRADES_HEADER_ROW = 5;
const EXEMPT_FILL = "FFF3F4F6";
const MISSING_FILL = "FFFFC7CE";
const MUTED_FONT = { color: { argb: "FF6B7280" }, italic: true };

export async function buildGradesWorkbook(
  sheet: GradeSheet,
  meta: { groupName: string; periodName: string; from: DateStr; to: DateStr },
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Baholar", {
    views: [{ state: "frozen", xSplit: 1, ySplit: GRADES_HEADER_ROW }],
  });

  ws.getCell("A1").value = `Guruh: ${meta.groupName}`;
  ws.getCell("A1").font = { bold: true, size: 13 };
  ws.getCell("A2").value =
    `Davr: ${meta.periodName} (${formatDate(meta.from)} – ${formatDate(meta.to)})`;
  ws.getCell("A3").value = `O'tish chegarasi: ${sheet.passPercent}%`;
  ws.getCell("A4").value =
    "— ozod qilingan · qizil — muddati o'tib baholanmagan (0) · bo'sh — muddati hali o'tmagan";
  ws.getCell("A4").font = MUTED_FONT;

  const n = sheet.items.length;
  const header = ws.getRow(GRADES_HEADER_ROW);
  header.values = [
    "O'quvchi",
    ...sheet.items.map(
      (i) =>
        `${ITEM_TYPE_LABEL[i.type]}: ${i.title}${i.dueDate ? ` (${formatDayMonth(i.dueDate)})` : ""} / ${i.maxPoints}`,
    ),
    "Tuzatish",
    "Jami",
    "Maks.",
    "Foiz",
    "Holat",
  ];
  header.font = { bold: true };
  header.alignment = { wrapText: true, vertical: "top" };
  header.height = 45;
  ws.getColumn(1).width = sheet.students.some((s) => s.departure) ? 46 : 30;
  for (let c = 2; c <= n + 1; c++) ws.getColumn(c).width = 14;
  for (let c = n + 2; c <= n + 6; c++) ws.getColumn(c).width = 10;

  sheet.students.forEach((s, r) => {
    const row = ws.getRow(GRADES_HEADER_ROW + 1 + r);
    const name = row.getCell(1);
    name.value = studentLabel(s);
    if (s.departure) name.font = MUTED_FONT;

    s.cells.forEach((cell, j) => {
      const target = row.getCell(2 + j);
      target.alignment = { horizontal: "center" };
      if (cell.kind === "points") {
        target.value = cell.points;
        if (cell.note) target.note = cell.note;
        if (cell.missing)
          target.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: MISSING_FILL },
          };
      } else if (cell.kind === "exempt") {
        target.value = cellText(cell);
        target.note = `Ozod: ${cell.reason}`;
        target.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: EXEMPT_FILL },
        };
      }
    });

    const adj = row.getCell(n + 2);
    if (s.adjustment !== 0) {
      adj.value = s.adjustment;
      adj.note = s.adjustments
        .map((a) => `${signedPoints(a.points)}: ${a.reason}`)
        .join("\n");
    }
    row.getCell(n + 3).value = s.total;
    row.getCell(n + 3).font = { bold: true };
    row.getCell(n + 4).value = s.max;
    const pct = row.getCell(n + 5);
    pct.value = s.percent === null ? null : s.percent / 100;
    pct.numFmt = "0%";
    row.getCell(n + 6).value =
      s.passed === null ? "—" : s.passed ? "O'tdi" : "O'tmadi";
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/** baholar_<guruh>_<davr>.xlsx */
export function gradesFileName(groupName: string, periodName: string): string {
  return `baholar_${fileSafe(groupName)}_${fileSafe(periodName)}.xlsx`;
}
