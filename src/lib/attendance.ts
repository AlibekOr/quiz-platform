import ExcelJS from "exceljs";
import { fileSafe } from "@/lib/format";
import {
  departureLabel,
  isMemberOn,
  type Departure,
  type MembershipPeriod,
} from "@/lib/memberships";
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

export type ReportStudent = {
  id: string;
  fullName: string;
  /** Guruhdan ketgan bo'lsa (o'tkazilgan yoki chiqarilgan) — hisobotda belgi bilan qoladi */
  departure: Departure | null;
  cells: ReportCell[];
  /** dates tartibida: o'sha kuni guruh a'zosi bo'lganmi (a'zolik davri tashqarisi kulrang) */
  member: boolean[];
  stats: AttendanceStats;
};

export type AttendanceReport = {
  dates: DateStr[];
  students: ReportStudent[];
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
  /** Davr ichida kamida bir kun guruh a'zosi bo'lganlar (davomati bo'lmasa ham jadvalda chiqadi) */
  members: {
    id: string;
    fullName: string;
    periods: MembershipPeriod[];
    departure: Departure | null;
  }[];
};

/**
 * O'quvchilar × sanalar matritsasi. O'quvchilar: davrda guruh a'zosi bo'lganlar + shu guruh
 * darslarida yozuvi borlar. Avval hozirgi a'zolar, keyin guruhdan ketganlar, alifbo bo'yicha.
 * Yozuvi yo'q katak foizga kirmaydi; a'zolik davri tashqarisidagi katak `member = false`.
 * Saqlangan yozuv har doim ko'rsatiladi (a'zolik tarixi kiritilishidan oldingi darslar ham).
 */
export function buildAttendanceReport(input: ReportInput): AttendanceReport {
  const lessons = [...input.lessons].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const dates = lessons.map((l) => l.date);

  const people = new Map(
    input.members.map((m) => [
      m.id,
      { fullName: m.fullName, periods: m.periods, departure: m.departure },
    ]),
  );
  for (const l of lessons)
    for (const r of l.records)
      if (!people.has(r.studentId))
        people.set(r.studentId, {
          fullName: r.studentName,
          periods: [],
          departure: null,
        });

  const byLesson = lessons.map(
    (l) => new Map(l.records.map((r) => [r.studentId, r])),
  );

  const students = [...people.entries()]
    .sort(
      ([, a], [, b]) =>
        Number(a.departure !== null) - Number(b.departure !== null) ||
        a.fullName.localeCompare(b.fullName, "uz"),
    )
    .map(([id, p]): ReportStudent => {
      const cells: ReportCell[] = byLesson.map((m) => {
        const r = m.get(id);
        return r ? { status: r.status, note: r.note } : null;
      });
      const member = dates.map((d) => isMemberOn(p.periods, d));
      const stats = computeStats(cells.flatMap((c) => (c ? [c.status] : [])));
      return {
        id,
        fullName: p.fullName,
        departure: p.departure,
        cells,
        member,
        stats,
      };
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
/** A'zolik davri tashqarisidagi kataklar va guruhdan ketganlar */
const OUTSIDE_FILL = "FFF3F4F6";
const MUTED_FONT = { color: { argb: "FF6B7280" }, italic: true };

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
  if (report.students.some((s) => s.member.some((m) => !m))) {
    sheet.getCell("A4").value =
      "Kulrang kataklar — o'quvchi o'sha kuni bu guruhda bo'lmagan";
    sheet.getCell("A4").font = MUTED_FONT;
  }

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
  const anyDeparture = report.students.some((s) => s.departure);
  sheet.getColumn(1).width = anyDeparture ? 48 : 30;
  for (let c = 2; c <= n + 1; c++) sheet.getColumn(c).width = 6;
  for (let c = n + 2; c <= n + 4; c++) sheet.getColumn(c).width = 11;

  report.students.forEach((s, i) => {
    const row = sheet.getRow(HEADER_ROW + 1 + i);
    const name = row.getCell(1);
    name.value = s.departure
      ? `${s.fullName} (${departureLabel(s.departure)})`
      : s.fullName;
    if (s.departure) name.font = MUTED_FONT;
    s.cells.forEach((cell, j) => {
      const target = row.getCell(2 + j);
      if (!s.member[j])
        target.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: OUTSIDE_FILL },
        };
      if (!cell) return;
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
