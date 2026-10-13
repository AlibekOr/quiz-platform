import ExcelJS from "exceljs";
import { fileSafe } from "@/lib/format";
import {
  CATEGORY_LABEL,
  signedPoints,
  STATUS_LABEL,
  studentLabel,
  type AssignmentCategory,
  type PointCategory,
  type SemesterStatus,
} from "@/lib/grades";
import type { SemesterGrades } from "@/lib/grades-data";
import { formatDate, formatDayMonth } from "@/lib/time";

// Semestr ballarini Excel'ga eksport (TASKS.md, 6-bosqich): birinchi varaqda umumiy jadval,
// keyingilarida har kategoriya batafsil

export const GRADES_HEADER_ROW = 4;
/** Har varaqda: 1-ustun — №, 2-ustun — o'quvchi, ma'lumotlar 3-ustundan */
const NAME_COL = 2;
const DATA_COL = NAME_COL + 1;
const MUTED_FONT = { color: { argb: "FF6B7280" }, italic: true };
const STATUS_FILL: Partial<Record<SemesterStatus, string>> = {
  FAILED: "FFFFC7CE",
  EXTRA_CHANCE: "FFFFEB9C",
  PASSED: "FFC6EFCE",
};

const SUMMARY: { category: PointCategory; label: string }[] = [
  { category: "HOMEWORK", label: "Uy vazifa" },
  { category: "PRACTICAL", label: "Amaliy" },
  { category: "ORAL", label: "Og'zaki" },
  { category: "BONUS", label: "Bonus" },
];

const DETAIL_CATEGORIES: AssignmentCategory[] = [
  "HOMEWORK",
  "PRACTICAL",
  "BONUS",
  "EXTRA",
];

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  data: SemesterGrades,
  title: string,
) {
  const ws = workbook.addWorksheet(name, {
    views: [{ state: "frozen", xSplit: NAME_COL, ySplit: GRADES_HEADER_ROW }],
  });
  const { semester } = data;
  ws.getCell("A1").value = `${semester.group.name} · ${semester.name}`;
  ws.getCell("A1").font = { bold: true, size: 13 };
  ws.getCell("A2").value =
    `${formatDate(semester.startDate)} – ${formatDate(semester.endDate)} · ${title}`;
  ws.getCell("A2").font = MUTED_FONT;
  ws.getColumn(1).width = 5;
  ws.getColumn(NAME_COL).width = data.students.some((s) => s.departure)
    ? 46
    : 30;
  return ws;
}

function header(ws: ExcelJS.Worksheet, values: string[]) {
  const row = ws.getRow(GRADES_HEADER_ROW);
  row.values = ["№", ...values];
  row.font = { bold: true };
  row.alignment = { wrapText: true, vertical: "top", horizontal: "center" };
  row.getCell(NAME_COL).alignment = { vertical: "top" };
  row.height = 32;
}

/** № va ism; qator markazlanadi, ism chapda */
function nameCell(
  row: ExcelJS.Row,
  s: SemesterGrades["students"][number],
  index: number,
) {
  row.getCell(1).value = index + 1;
  const cell = row.getCell(NAME_COL);
  cell.value = studentLabel(s);
  if (s.departure) cell.font = MUTED_FONT;
  row.alignment = { horizontal: "center" };
  cell.alignment = { horizontal: "left" };
}

export async function buildGradesWorkbook(
  data: SemesterGrades,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const { rules } = data.semester;

  // 1-varaq: o'quvchilar × kategoriyalar ("yig'ilgan / chegara" — ikki ustun emas, son va izoh)
  const ws = addSheet(
    workbook,
    "Jami",
    data,
    `jami ${rules.maxTotal}, o'tish ${data.students[0]?.result.passScore ?? ""}`,
  );
  header(ws, [
    "O'quvchi",
    ...SUMMARY.map((c) =>
      c.category === "BONUS"
        ? c.label
        : `${c.label} / ${data.students[0]?.result.categories[c.category].cap ?? ""}`,
    ),
    "Tuzatish",
    `Qo'shimcha / ${rules.extraCap}`,
    "Jarima",
    `Jami / ${rules.maxTotal}`,
    "Holat",
  ]);
  for (let c = DATA_COL; c < DATA_COL + SUMMARY.length + 5; c++)
    ws.getColumn(c).width = 13;

  data.students.forEach((s, i) => {
    const r = s.result;
    const row = ws.getRow(GRADES_HEADER_ROW + 1 + i);
    nameCell(row, s, i);
    SUMMARY.forEach((c, j) => {
      row.getCell(DATA_COL + j).value = r.categories[c.category].earned;
    });
    const n = DATA_COL + SUMMARY.length;
    const adj = row.getCell(n);
    if (r.adjustments !== 0) {
      adj.value = r.adjustments;
      adj.note = s.adjustments
        .map((a) => `${signedPoints(a.points)}: ${a.reason}`)
        .join("\n");
    }
    if (r.categories.EXTRA.earned > 0)
      row.getCell(n + 1).value = r.categories.EXTRA.earned;
    if (r.penalties > 0) row.getCell(n + 2).value = -r.penalties;
    row.getCell(n + 3).value = r.total;
    row.getCell(n + 3).font = { bold: true };
    const status = row.getCell(n + 4);
    status.value = STATUS_LABEL[r.status];
    const fill = STATUS_FILL[r.status];
    if (fill)
      status.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fill },
      };
  });

  // Kategoriya varaqlari: o'quvchilar × topshiriqlar
  for (const category of DETAIL_CATEGORIES) {
    const items = data.assignments.filter((a) => a.category === category);
    if (items.length === 0) continue;
    const sheet = addSheet(
      workbook,
      CATEGORY_LABEL[category],
      data,
      CATEGORY_LABEL[category],
    );
    header(sheet, [
      "O'quvchi",
      ...items.map(
        (a) => `${a.title} (${formatDayMonth(a.dueDate)}) / ${a.maxPoints}`,
      ),
      "Jami",
    ]);
    items.forEach((_, j) => (sheet.getColumn(DATA_COL + j).width = 14));
    data.students.forEach((s, i) => {
      const row = sheet.getRow(GRADES_HEADER_ROW + 1 + i);
      nameCell(row, s, i);
      items.forEach((a, j) => {
        const g = s.grades[a.id];
        if (!g) return;
        const cell = row.getCell(DATA_COL + j);
        cell.value = g.points;
        if (g.note) cell.note = g.note;
      });
      const total = row.getCell(DATA_COL + items.length);
      total.value = s.result.categories[category].earned;
      total.font = { bold: true };
    });
  }

  // Og'zaki: o'quvchilar × dars sanalari
  const dates = [
    ...new Set(data.students.flatMap((s) => s.oral.map((o) => o.date))),
  ].sort();
  if (dates.length > 0) {
    const sheet = addSheet(workbook, "Og'zaki", data, "Og'zaki savol-javob");
    header(sheet, ["O'quvchi", ...dates.map(formatDayMonth), "Jami"]);
    data.students.forEach((s, i) => {
      const row = sheet.getRow(GRADES_HEADER_ROW + 1 + i);
      nameCell(row, s, i);
      s.oral.forEach((o) => {
        row.getCell(DATA_COL + dates.indexOf(o.date)).value = o.points;
      });
      const total = row.getCell(DATA_COL + dates.length);
      total.value = s.result.categories.ORAL.earned;
      total.font = { bold: true };
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/** baholar_<guruh>_<semestr>.xlsx */
export function gradesFileName(
  groupName: string,
  semesterName: string,
): string {
  return `baholar_${fileSafe(groupName)}_${fileSafe(semesterName)}.xlsx`;
}
