import ExcelJS from "exceljs";
import { fileSafe } from "@/lib/format";
import { formatDayMonth, monthRange, type DateStr } from "@/lib/time";

// Davomat hisobi va Excel eksport (PLAN.md, "Davomat"). Sof funksiyalar — testlar bilan

export type AttendanceMark = "PRESENT" | "ABSENT" | "LATE";

/** Excel va jadval belgilari: + keldi, − kelmadi, K kechikdi */
export const MARK_SYMBOL: Record<AttendanceMark, string> = {
  PRESENT: "+",
  ABSENT: "−",
  LATE: "K",
};

export const MARK_LABEL: Record<AttendanceMark, string> = {
  PRESENT: "Keldi",
  ABSENT: "Kelmadi",
  LATE: "Kechikdi",
};

/** Hisobotda LATE "keldi" deb hisoblanadi; sababli qolgan ham ABSENT */
export function isPresent(mark: AttendanceMark): boolean {
  return mark !== "ABSENT";
}

export type AttendanceStats = {
  present: number;
  absent: number;
  late: number;
  total: number;
  percent: number | null;
};

export function computeStats(
  marks: readonly AttendanceMark[],
): AttendanceStats {
  const present = marks.filter(isPresent).length;
  const late = marks.filter((m) => m === "LATE").length;
  const total = marks.length;
  return {
    present,
    absent: total - present,
    late,
    total,
    percent: total === 0 ? null : Math.round((present / total) * 100),
  };
}

export type ReportCell = { status: AttendanceMark; note: string | null } | null;

export type AttendanceReport = {
  dates: DateStr[];
  students: {
    id: string;
    fullName: string;
    cells: ReportCell[];
    stats: AttendanceStats;
  }[];
  /** Har bir dars bo'yicha kelganlar soni (dates tartibida) */
  presentPerLesson: number[];
};

export type ReportInput = {
  lessons: {
    date: DateStr;
    records: {
      studentId: string;
      studentName: string;
      status: AttendanceMark;
      note: string | null;
    }[];
  }[];
  /** Guruhning hozirgi o'quvchilari (davomati bo'lmasa ham jadvalda chiqadi) */
  currentStudents: { id: string; fullName: string }[];
};

/**
 * O'quvchilar × sanalar matritsasi. O'quvchilar: hozirgi guruh a'zolari + davrda yozuvi
 * bo'lganlar (boshqa guruhga o'tgan bo'lsa ham tarix saqlanadi), alifbo bo'yicha.
 * Yozuvi yo'q katak (masalan, guruhga keyin qo'shilgan) foizga kirmaydi.
 */
export function buildAttendanceReport(input: ReportInput): AttendanceReport {
  const lessons = [...input.lessons].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const dates = lessons.map((l) => l.date);

  const names = new Map(input.currentStudents.map((s) => [s.id, s.fullName]));
  for (const l of lessons)
    for (const r of l.records)
      if (!names.has(r.studentId)) names.set(r.studentId, r.studentName);

  const byLesson = lessons.map(
    (l) => new Map(l.records.map((r) => [r.studentId, r])),
  );

  const students = [...names.entries()]
    .sort(([, a], [, b]) => a.localeCompare(b, "uz"))
    .map(([id, fullName]) => {
      const cells: ReportCell[] = byLesson.map((m) => {
        const r = m.get(id);
        return r ? { status: r.status, note: r.note } : null;
      });
      const stats = computeStats(cells.flatMap((c) => (c ? [c.status] : [])));
      return { id, fullName, cells, stats };
    });

  const presentPerLesson = lessons.map(
    (l) => l.records.filter((r) => isPresent(r.status)).length,
  );
  return { dates, students, presentPerLesson };
}

/** Eng ko'p dars qoldirganlar (kamida bitta kelmagan), ko'pdan kamga */
export function mostAbsent(report: AttendanceReport, limit = 5) {
  return report.students
    .filter((s) => s.stats.absent > 0)
    .sort(
      (a, b) =>
        b.stats.absent - a.stats.absent ||
        a.fullName.localeCompare(b.fullName, "uz"),
    )
    .slice(0, limit);
}

/** davomat_<guruh>_<YYYY-MM>.xlsx; to'liq oy bo'lmasa davomat_<guruh>_<from>_<to>.xlsx */
export function attendanceFileName(
  groupName: string,
  from: DateStr,
  to: DateStr,
): string {
  const month = from.slice(0, 7);
  const whole = monthRange(month);
  const period =
    whole.from === from && whole.to === to ? month : `${from}_${to}`;
  return `davomat_${fileSafe(groupName)}_${period}.xlsx`;
}

export const HEADER_ROW = 5;
const FILL: Partial<Record<AttendanceMark, string>> = {
  ABSENT: "FFFFC7CE",
  LATE: "FFFFEB9C",
};

export async function buildAttendanceWorkbook(
  report: AttendanceReport,
  meta: { groupName: string; schedule: string; period: string },
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Davomat", {
    views: [{ state: "frozen", xSplit: 1, ySplit: HEADER_ROW }],
  });

  sheet.getCell("A1").value = `Guruh: ${meta.groupName}`;
  sheet.getCell("A1").font = { bold: true, size: 13 };
  sheet.getCell("A2").value = `Dars jadvali: ${meta.schedule || "—"}`;
  sheet.getCell("A3").value = `Davr: ${meta.period}`;

  const n = report.dates.length;
  const header = sheet.getRow(HEADER_ROW);
  header.values = [
    "O'quvchi",
    ...report.dates.map(formatDayMonth),
    "Keldi",
    "Kelmadi",
    "Davomat %",
  ];
  header.font = { bold: true };
  header.alignment = { horizontal: "center" };
  sheet.getColumn(1).width = 30;
  for (let c = 2; c <= n + 1; c++) sheet.getColumn(c).width = 6;
  for (let c = n + 2; c <= n + 4; c++) sheet.getColumn(c).width = 11;

  report.students.forEach((s, i) => {
    const row = sheet.getRow(HEADER_ROW + 1 + i);
    row.getCell(1).value = s.fullName;
    s.cells.forEach((cell, j) => {
      if (!cell) return;
      const target = row.getCell(2 + j);
      target.value = MARK_SYMBOL[cell.status];
      target.alignment = { horizontal: "center" };
      const fill = FILL[cell.status];
      if (fill)
        target.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: fill },
        };
      if (cell.note) target.note = cell.note;
    });
    row.getCell(n + 2).value = s.stats.present;
    row.getCell(n + 3).value = s.stats.absent;
    const pct = row.getCell(n + 4);
    pct.value = s.stats.percent === null ? null : s.stats.percent / 100;
    pct.numFmt = "0%";
  });

  const totals = sheet.getRow(HEADER_ROW + 1 + report.students.length);
  totals.getCell(1).value = "Kelganlar soni";
  report.presentPerLesson.forEach((count, j) => {
    totals.getCell(2 + j).value = count;
    totals.getCell(2 + j).alignment = { horizontal: "center" };
  });
  totals.font = { bold: true };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
