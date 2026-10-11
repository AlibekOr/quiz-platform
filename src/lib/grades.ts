import { departureLabel, type Departure } from "@/lib/memberships";
import type { DateStr } from "@/lib/time";

// Semestr bali (PLAN.md, 17-bosqich). Sof funksiyalar — testlar bilan.
//
//   base      = min(hw, homeworkCap) + min(practical, practicalCap) + min(oral, oralCap)
//               + bonus + adjustments
//   withExtra = base + min(extra, extraCap)
//   capped    = min(withExtra, maxTotal)
//   total     = max(0, capped − penalties)
//   passScore = maxTotal * passPercent / 100   // 36
//
// Testlar semestr baliga kirmaydi.

export type AssignmentCategory = "HOMEWORK" | "PRACTICAL" | "EXTRA" | "BONUS";
export type PointCategory = AssignmentCategory | "ORAL";

export type SemesterRules = {
  maxTotal: number;
  passPercent: number;
  failBelow: number;
  homeworkCap: number;
  practicalCap: number;
  oralCap: number;
  extraCap: number;
};

export const DEFAULT_RULES: SemesterRules = {
  maxTotal: 60,
  passPercent: 60,
  failBelow: 10,
  homeworkCap: 30,
  practicalCap: 20,
  oralCap: 10,
  extraCap: 40,
};

/** Har kategoriya bo'yicha yig'ilgan xom ballar (chegarasiz) */
export type PointSums = {
  homework: number;
  practical: number;
  oral: number;
  extra: number;
  bonus: number;
  /** Tuzatishlar yig'indisi (manfiy ham bo'lishi mumkin) */
  adjustments: number;
  /** Jarimalar yig'indisi (musbat son, ayiriladi) */
  penalties: number;
};

export const EMPTY_SUMS: PointSums = {
  homework: 0,
  practical: 0,
  oral: 0,
  extra: 0,
  bonus: 0,
  adjustments: 0,
  penalties: 0,
};

export type SemesterStatus =
  "IN_PROGRESS" | "PASSED" | "EXTRA_CHANCE" | "FAILED";

export type CategoryResult = {
  /** Yig'ilgan xom ball */
  earned: number;
  /** Chegara (BONUS uchun null — chegarasiz) */
  cap: number | null;
  /** Jamiga kirgan qismi: min(earned, cap) */
  counted: number;
};

export type SemesterResult = {
  categories: Record<PointCategory, CategoryResult>;
  adjustments: number;
  penalties: number;
  /** EXTRA'siz jami (jarimalardan keyin, [0, maxTotal]) — holat va EXTRA ruxsati shundan */
  withoutExtra: number;
  /** Yakuniy jami, [0, maxTotal] */
  total: number;
  maxTotal: number;
  passScore: number;
  status: SemesterStatus;
  /** Shu o'quvchiga EXTRA ball qo'yish mumkinmi */
  canReceiveExtra: boolean;
};

/** 0.1 gacha yaxlitlash */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** O'tish bali: 60 * 60% = 36 */
export function passScore(rules: SemesterRules): number {
  return round1((rules.maxTotal * rules.passPercent) / 100);
}

/** Semestr tugaganmi: o'qituvchi yopgan yoki oxirgi kuni o'tgan (Toshkent kuni) */
export function isSemesterEnded(
  semester: { endDate: DateStr; closed: boolean },
  today: DateStr,
): boolean {
  return semester.closed || today > semester.endDate;
}

/** EXTRA faqat semestr tugagach va EXTRA'siz jami [failBelow, passScore) oralig'ida bo'lsa */
export function canReceiveExtra(
  rules: SemesterRules,
  withoutExtra: number,
  ended: boolean,
): boolean {
  return (
    ended && withoutExtra >= rules.failBelow && withoutExtra < passScore(rules)
  );
}

function category(earned: number, cap: number | null): CategoryResult {
  const e = round1(earned);
  return { earned: e, cap, counted: cap === null ? e : Math.min(e, cap) };
}

function finalTotal(sum: number, rules: SemesterRules, penalties: number) {
  return round1(Math.max(0, Math.min(sum, rules.maxTotal) - penalties));
}

export function computeSemesterResult(
  rules: SemesterRules,
  sums: PointSums,
  ended: boolean,
): SemesterResult {
  const categories: Record<PointCategory, CategoryResult> = {
    HOMEWORK: category(sums.homework, rules.homeworkCap),
    PRACTICAL: category(sums.practical, rules.practicalCap),
    ORAL: category(sums.oral, rules.oralCap),
    EXTRA: category(sums.extra, rules.extraCap),
    BONUS: category(sums.bonus, null),
  };
  const adjustments = round1(sums.adjustments);
  const penalties = round1(sums.penalties);
  const base =
    categories.HOMEWORK.counted +
    categories.PRACTICAL.counted +
    categories.ORAL.counted +
    categories.BONUS.counted +
    adjustments;

  const withoutExtra = finalTotal(base, rules, penalties);
  const total = finalTotal(base + categories.EXTRA.counted, rules, penalties);
  const pass = passScore(rules);
  const extraAllowed = canReceiveExtra(rules, withoutExtra, ended);

  let status: SemesterStatus;
  if (!ended) status = "IN_PROGRESS";
  else if (total >= pass) status = "PASSED";
  else if (extraAllowed) status = "EXTRA_CHANCE";
  else status = "FAILED";

  return {
    categories,
    adjustments,
    penalties,
    withoutExtra,
    total,
    maxTotal: rules.maxTotal,
    passScore: pass,
    status,
    canReceiveExtra: extraAllowed,
  };
}

/** Ball qadami: HOMEWORK va ORAL — 0 / 0.5 / 1; qolganlari 0..maxPoints, 0.5 qadam */
export function isValidPoints(
  category: PointCategory,
  points: number,
  maxPoints: number,
): boolean {
  if (!Number.isFinite(points) || points < 0) return false;
  if (!Number.isInteger(points * 2)) return false;
  const max = category === "HOMEWORK" || category === "ORAL" ? 1 : maxPoints;
  return points <= max;
}

/** 12 -> "12", 12.5 -> "12,5" */
export function formatPoints(points: number): string {
  return String(round1(points)).replace(".", ",");
}

export function signedPoints(points: number): string {
  return points > 0 ? `+${formatPoints(points)}` : formatPoints(points);
}

/** "12,5 / 30" (BONUS uchun faqat ball) */
export function categoryText(c: CategoryResult): string {
  return c.cap === null
    ? formatPoints(c.earned)
    : `${formatPoints(c.earned)} / ${c.cap}`;
}

export function studentLabel(s: {
  fullName: string;
  departure: Departure | null;
}): string {
  return s.departure
    ? `${s.fullName} (${departureLabel(s.departure)})`
    : s.fullName;
}

export const CATEGORY_LABEL: Record<PointCategory, string> = {
  HOMEWORK: "Uyga vazifa",
  PRACTICAL: "Amaliy",
  ORAL: "Og'zaki",
  EXTRA: "Qo'shimcha",
  BONUS: "Bonus",
};

export const STATUS_LABEL: Record<SemesterStatus, string> = {
  IN_PROGRESS: "Jarayonda",
  PASSED: "O'tdi",
  EXTRA_CHANCE: "Qo'shimcha imkoniyat",
  FAILED: "Yiqildi",
};

/** Topshiriq kategoriyalari tanlash ro'yxati uchun (ORAL — darsda, alohida) */
export const ASSIGNMENT_CATEGORIES: readonly AssignmentCategory[] = [
  "HOMEWORK",
  "PRACTICAL",
  "BONUS",
  "EXTRA",
];
