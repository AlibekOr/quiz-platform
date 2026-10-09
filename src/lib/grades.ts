import { departureLabel, type Departure } from "@/lib/memberships";
import type { DateStr } from "@/lib/time";

// Baholar hisobi (PLAN.md, 12-bosqich). Sof funksiyalar — testlar bilan.
// Davr varag'i: o'quvchilar × itemlar (uyga vazifalar va davrga biriktirilgan testlar)

export type GradeItemType = "HOMEWORK" | "TEST";

export type GradeItem = {
  type: GradeItemType;
  /** Homework.id yoki Test.id */
  id: string;
  title: string;
  /** Vazifa: maxPoints; test: davrdagi bali (TestPeriod.points) */
  maxPoints: number;
  /** Muddat (Toshkent kuni). Shu kun tugagach baholanmagan item 0 hisoblanadi; null — muddatsiz */
  dueDate: DateStr | null;
};

/** Item kaliti: "HOMEWORK:<id>" — xaritalar va ozod qilishlar uchun */
export function itemKey(item: { type: GradeItemType; id: string }): string {
  return `${item.type}:${item.id}`;
}

export type StudentGradeInput = {
  id: string;
  fullName: string;
  departure: Departure | null;
  /** Vazifa bali (homeworkId -> ball va izoh) */
  homework: ReadonlyMap<string, { points: number; note: string | null }>;
  /** Birinchi tugallangan urinish (testId -> score/maxScore) */
  tests: ReadonlyMap<string, { score: number; maxScore: number }>;
  /** Ozod qilingan itemlar (itemKey -> sabab) */
  exemptions: ReadonlyMap<string, string>;
  adjustments: readonly { points: number; reason: string }[];
};

export type GradeCell =
  /** Hisobga kirgan ball (muddati o'tib baholanmagani ham — 0, missing) */
  | { kind: "points"; points: number; note: string | null; missing: boolean }
  /** Ozod qilingan: jami va maksimaldan chiqariladi */
  | { kind: "exempt"; reason: string }
  /** Muddati hali o'tmagan va baholanmagan: hisobga kirmaydi */
  | { kind: "pending" };

export type StudentGrades = {
  id: string;
  fullName: string;
  departure: Departure | null;
  cells: GradeCell[];
  /** Itemlardan to'plangan ball */
  earned: number;
  adjustment: number;
  adjustments: readonly { points: number; reason: string }[];
  /** earned + adjustment, [0, max] oralig'ida */
  total: number;
  /** Hisobga kirgan itemlarning maksimal bali */
  max: number;
  /** total / max, butun foiz; max = 0 bo'lsa null */
  percent: number | null;
  passed: boolean | null;
};

export type GradeSheet = {
  items: GradeItem[];
  passPercent: number;
  students: StudentGrades[];
};

/** 0.1 gacha yaxlitlash */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Test bali: birinchi urinish foizi × testning davrdagi bali */
export function testPoints(
  score: number,
  maxScore: number,
  points: number,
): number {
  return maxScore > 0 ? round1((score / maxScore) * points) : 0;
}

/** Muddat kuni tugaganmi (bugun muddatdan keyingi kun yoki undan keyin) */
export function isOverdue(dueDate: DateStr | null, today: DateStr): boolean {
  return dueDate !== null && today > dueDate;
}

export function gradeCell(
  item: GradeItem,
  student: StudentGradeInput,
  today: DateStr,
): GradeCell {
  const reason = student.exemptions.get(itemKey(item));
  if (reason !== undefined) return { kind: "exempt", reason };

  if (item.type === "HOMEWORK") {
    const g = student.homework.get(item.id);
    if (g)
      return {
        kind: "points",
        points: Math.min(g.points, item.maxPoints),
        note: g.note,
        missing: false,
      };
  } else {
    const a = student.tests.get(item.id);
    if (a)
      return {
        kind: "points",
        points: testPoints(a.score, a.maxScore, item.maxPoints),
        note: null,
        missing: false,
      };
  }
  return isOverdue(item.dueDate, today)
    ? { kind: "points", points: 0, note: null, missing: true }
    : { kind: "pending" };
}

export function computeStudentGrades(
  items: readonly GradeItem[],
  student: StudentGradeInput,
  passPercent: number,
  today: DateStr,
): StudentGrades {
  const cells = items.map((item) => gradeCell(item, student, today));
  let earned = 0;
  let max = 0;
  cells.forEach((c, i) => {
    if (c.kind !== "points") return;
    earned += c.points;
    max += items[i].maxPoints;
  });
  earned = round1(earned);
  const adjustment = student.adjustments.reduce((s, a) => s + a.points, 0);
  const total = round1(Math.min(max, Math.max(0, earned + adjustment)));
  const percent = max > 0 ? Math.round((total / max) * 100) : null;
  return {
    id: student.id,
    fullName: student.fullName,
    departure: student.departure,
    cells,
    earned,
    adjustment,
    adjustments: student.adjustments,
    total,
    max,
    percent,
    passed: percent === null ? null : percent >= passPercent,
  };
}

/** Itemlar muddati bo'yicha (muddatsizlar oxirida); o'quvchilar: avval hozirgi a'zolar, alifbo */
export function buildGradeSheet(input: {
  items: readonly GradeItem[];
  students: readonly StudentGradeInput[];
  passPercent: number;
  today: DateStr;
}): GradeSheet {
  const items = [...input.items].sort(
    (a, b) =>
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
      a.title.localeCompare(b.title, "uz"),
  );
  const students = [...input.students]
    .sort(
      (a, b) =>
        Number(a.departure !== null) - Number(b.departure !== null) ||
        a.fullName.localeCompare(b.fullName, "uz"),
    )
    .map((s) => computeStudentGrades(items, s, input.passPercent, input.today));
  return { items, passPercent: input.passPercent, students };
}

/** 12 -> "12", 12.5 -> "12,5" */
export function formatPoints(points: number): string {
  return String(round1(points)).replace(".", ",");
}

export function signedPoints(points: number): string {
  return points > 0 ? `+${formatPoints(points)}` : formatPoints(points);
}

/** Katak matni: ball, ozod "—", kutilmoqda bo'sh */
export function cellText(cell: GradeCell): string {
  if (cell.kind === "exempt") return "—";
  if (cell.kind === "pending") return "";
  return formatPoints(cell.points);
}

export function studentLabel(s: {
  fullName: string;
  departure: Departure | null;
}): string {
  return s.departure
    ? `${s.fullName} (${departureLabel(s.departure)})`
    : s.fullName;
}

export const ITEM_TYPE_LABEL: Record<GradeItemType, string> = {
  HOMEWORK: "Vazifa",
  TEST: "Test",
};
