import ExcelJS from "exceljs";
import { fileSafe } from "@/lib/format";
import {
  signedPoints,
  STATUS_LABEL,
  studentLabel,
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

/** Excel varaq nomi: 31 belgigacha, taqiqlangan belgilarsiz, takrorlanmas */
function sheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 28) || "Varaq";
  let result = base;
  for (let i = 2; used.has(result.toLowerCase()); i++) result = `${base} ${i}`;
  used.add(result.toLowerCase());
  return result;
}

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
  const used = new Set<string>(["jami"]);
  // Jami varag'idagi ustunlar: qo'shimchadan boshqa kategoriyalar semestr tartibida
  const summary = rules.categories.filter((c) => c.kind !== "EXTRA");
  const extraIds = new Set(
    rules.categories.filter((c) => c.kind === "EXTRA").map((c) => c.id),
  );

  // 1-varaq: o'quvchilar × kategoriyalar ("yig'ilgan / chegara" — ikki ustun emas, son va izoh)
  const ws = addSheet(
    workbook,
    "Jami",
    data,
    `jami ${rules.maxTotal}, o'tish ${data.students[0]?.result.passScore ?? ""}`,
  );
  header(ws, [
    "O'quvchi",
    ...summary.map((c) => (c.cap === null ? c.name : `${c.name} / ${c.cap}`)),
    "Tuzatish",
    "Qo'shimcha",
    "Jarima",
    `Jami / ${rules.maxTotal}`,
    "Holat",
  ]);
  for (let c = DATA_COL; c < DATA_COL + summary.length + 5; c++)
    ws.getColumn(c).width = 13;

  data.students.forEach((s, i) => {
    const r = s.result;
    const earnedOf = new Map(r.categories.map((c) => [c.id, c.earned]));
    const row = ws.getRow(GRADES_HEADER_ROW + 1 + i);
    nameCell(row, s, i);
    summary.forEach((c, j) => {
      row.getCell(DATA_COL + j).value = earnedOf.get(c.id) ?? 0;
    });
    const n = DATA_COL + summary.length;
    const adj = row.getCell(n);
    if (r.adjustments !== 0) {
      adj.value = r.adjustments;
      adj.note = s.adjustments
        .map((a) => `${signedPoints(a.points)}: ${a.reason}`)
        .join("\n");
    }
    const extra = r.categories
      .filter((c) => extraIds.has(c.id))
      .reduce((sum, c) => sum + c.earned, 0);
    if (extra > 0) row.getCell(n + 1).value = extra;
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
  for (const category of rules.categories) {
    if (category.kind === "ORAL") continue;
    const items = data.assignments.filter((a) => a.categoryId === category.id);
    if (items.length === 0) continue;
    const sheet = addSheet(
      workbook,
      sheetName(category.name, used),
      data,
      category.name,
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
      total.value =
        s.result.categories.find((c) => c.id === category.id)?.earned ?? 0;
      total.font = { bold: true };
    });
  }

  // Og'zaki: o'quvchilar × dars sanalari
  const oral = rules.categories.find((c) => c.kind === "ORAL");
  const dates = [
    ...new Set(data.students.flatMap((s) => s.oral.map((o) => o.date))),
  ].sort();
  if (oral && dates.length > 0) {
    const sheet = addSheet(
      workbook,
      sheetName(oral.name, used),
      data,
      `${oral.name} savol-javob`,
    );
    header(sheet, ["O'quvchi", ...dates.map(formatDayMonth), "Jami"]);
    data.students.forEach((s, i) => {
      const row = sheet.getRow(GRADES_HEADER_ROW + 1 + i);
      nameCell(row, s, i);
      s.oral.forEach((o) => {
        row.getCell(DATA_COL + dates.indexOf(o.date)).value = o.points;
      });
      const total = row.getCell(DATA_COL + dates.length);
      total.value =
        s.result.categories.find((c) => c.id === oral.id)?.earned ?? 0;
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
