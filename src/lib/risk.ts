import { computeStats, type AttendanceMark } from "@/lib/attendance";
import { formatPoints } from "@/lib/grades";
import { addDays, toDbDate, type DateStr } from "@/lib/time";

// Xavf ostidagi o'quvchilar (FEATURES.md, A qism). Sof funksiyalar — testlar bilan.
// Ma'lumotni yig'ish (doira, a'zolik davrlari, semestr) chaqiruvchida; bu yerda faqat qoidalar.

export type RiskSignalKind =
  | "CONSECUTIVE_ABSENCES"
  | "LOW_ATTENDANCE"
  | "MISSED_ASSIGNMENTS"
  | "SCORE_PACE"
  | "PENALTIES";

/** Menejerga faqat shular (baholar unga yopiq — CLAUDE.md, 13-qoida) */
export const MANAGER_SIGNALS: readonly RiskSignalKind[] = [
  "CONSECUTIVE_ABSENCES",
  "LOW_ATTENDANCE",
  "MISSED_ASSIGNMENTS",
];

export type RiskSettings = {
  consecutiveAbsences: { enabled: boolean; min: number };
  lowAttendance: { enabled: boolean; belowPercent: number; minLessons: number };
  missedAssignments: { enabled: boolean; lastN: number; minMissed: number };
  /** Kutilgan ball = passScore × f; xavf: jami < kutilgan × ratio */
  scorePace: {
    enabled: boolean;
    ratio: number;
    graceDays: number;
    /** Semestrning shu qismidan keyin bu signal yolg'iz o'zi ham "Yuqori" */
    highAfter: number;
  };
  penalties: { enabled: boolean; windowDays: number; minPoints: number };
};

export const DEFAULT_RISK_SETTINGS: RiskSettings = {
  consecutiveAbsences: { enabled: true, min: 2 },
  lowAttendance: { enabled: true, belowPercent: 70, minLessons: 4 },
  missedAssignments: { enabled: true, lastN: 3, minMissed: 2 },
  scorePace: { enabled: true, ratio: 0.8, graceDays: 14, highAfter: 0.7 },
  penalties: { enabled: true, windowDays: 30, minPoints: 5 },
};

export type RiskInput = {
  today: DateStr;
  semester: { startDate: DateStr; endDate: DateStr };
  /**
   * Semestrdagi, o'quvchi guruhda bo'lgan (GroupMembership) va bugungacha o'tgan darslar.
   * mark = null — davomat belgilanmagan
   */
  lessons: { date: DateStr; mark: AttendanceMark | null }[];
  /** Muddati o'tgan vazifalar (uyga vazifa, amaliy). points = null — ball qo'yilmagan */
  assignments: { dueDate: DateStr; points: number | null }[];
  /** Semestr jami (lib/grades.ts) va o'tish bali */
  total: number;
  passScore: number;
  /** Jarimalar (qo'lda + avtomatik), musbat ball */
  penalties: { date: DateStr; points: number }[];
};

export type RiskSignal = {
  kind: RiskSignalKind;
  /** Qisqa yorliq: "Ketma-ket qoldirish" */
  label: string;
  /** Aniq raqamlar: "3 dars ketma-ket qoldirgan" */
  detail: string;
};

export type RiskLevel = "HIGH" | "MEDIUM";

export type RiskResult = {
  /** null — xavf yo'q */
  level: RiskLevel | null;
  signals: RiskSignal[];
};

export const SIGNAL_LABEL: Record<RiskSignalKind, string> = {
  CONSECUTIVE_ABSENCES: "Ketma-ket qoldirish",
  LOW_ATTENDANCE: "Davomat past",
  MISSED_ASSIGNMENTS: "Vazifalar topshirilmagan",
  SCORE_PACE: "Ball sur'ati orqada",
  PENALTIES: "Jarimalar ko'p",
};

export const LEVEL_LABEL: Record<RiskLevel, string> = {
  HIGH: "Yuqori",
  MEDIUM: "O'rta",
};

const DAY_MS = 86_400_000;

function daysBetween(from: DateStr, to: DateStr): number {
  return Math.round(
    (toDbDate(to).getTime() - toDbDate(from).getTime()) / DAY_MS,
  );
}

/** Semestrning o'tgan qismi, [0, 1] */
export function semesterFraction(
  semester: RiskInput["semester"],
  today: DateStr,
): number {
  const span = daysBetween(semester.startDate, semester.endDate);
  if (span <= 0) return 1;
  return Math.min(
    1,
    Math.max(0, daysBetween(semester.startDate, today) / span),
  );
}

/**
 * Oxirgi darslardan boshlab ketma-ket ABSENT soni. Belgilanmagan darslar o'tkazib yuboriladi;
 * boshqa har qanday belgi (keldi, kechikdi, sababli) zanjirni uzadi
 */
export function trailingAbsences(lessons: RiskInput["lessons"]): number {
  const marked = lessons
    .filter((l) => l.mark !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
  let streak = 0;
  for (let i = marked.length - 1; i >= 0; i--) {
    if (marked[i].mark !== "ABSENT") break;
    streak++;
  }
  return streak;
}

function levelOf(signalCount: number, forceHigh: boolean): RiskLevel | null {
  if (signalCount >= 2 || forceHigh) return "HIGH";
  return signalCount === 1 ? "MEDIUM" : null;
}

export function computeRisk(
  input: RiskInput,
  settings: RiskSettings = DEFAULT_RISK_SETTINGS,
): RiskResult {
  const signals: RiskSignal[] = [];
  const add = (kind: RiskSignalKind, detail: string) =>
    signals.push({ kind, label: SIGNAL_LABEL[kind], detail });

  const { today, semester } = input;
  const lessons = input.lessons.filter(
    (l) =>
      l.date >= semester.startDate &&
      l.date <= today &&
      l.date <= semester.endDate,
  );

  const c = settings.consecutiveAbsences;
  if (c.enabled) {
    const streak = trailingAbsences(lessons);
    if (streak >= c.min)
      add("CONSECUTIVE_ABSENCES", `${streak} dars ketma-ket qoldirgan`);
  }

  const a = settings.lowAttendance;
  if (a.enabled) {
    const stats = computeStats(
      lessons.flatMap((l) => (l.mark ? [l.mark] : [])),
    );
    if (
      stats.total >= a.minLessons &&
      stats.percent !== null &&
      stats.percent < a.belowPercent
    )
      add(
        "LOW_ATTENDANCE",
        `davomat ${stats.percent}% (${stats.present} / ${stats.total} dars)`,
      );
  }

  const m = settings.missedAssignments;
  if (m.enabled) {
    const due = input.assignments
      .filter((x) => x.dueDate < today)
      .sort((x, y) => y.dueDate.localeCompare(x.dueDate))
      .slice(0, m.lastN);
    // O'quvchilar saytda hech narsa topshirmaydi: ball yo'q yoki 0 — topshirilmagan
    const missed = due.filter((x) => !x.points).length;
    if (due.length > 0 && missed >= m.minMissed)
      add(
        "MISSED_ASSIGNMENTS",
        `oxirgi ${due.length} ta vazifadan ${missed} tasi topshirilmagan`,
      );
  }

  const p = settings.scorePace;
  let paceHigh = false;
  if (p.enabled && daysBetween(semester.startDate, today) >= p.graceDays) {
    const f = semesterFraction(semester, today);
    const expected = Math.round(input.passScore * f * 10) / 10;
    if (input.total < expected * p.ratio) {
      add(
        "SCORE_PACE",
        `${formatPoints(input.total)} / ${formatPoints(input.passScore)} ball, kutilgan ${formatPoints(expected)}`,
      );
      paceHigh = f >= p.highAfter;
    }
  }

  const n = settings.penalties;
  if (n.enabled) {
    const from = addDays(today, -(n.windowDays - 1));
    const sum = input.penalties
      .filter((x) => x.date >= from && x.date <= today)
      .reduce((s, x) => s + x.points, 0);
    if (sum >= n.minPoints)
      add(
        "PENALTIES",
        `oxirgi ${n.windowDays} kunda −${formatPoints(sum)} ball jarima`,
      );
  }

  return { level: levelOf(signals.length, paceHigh), signals };
}

/** Menejer uchun: ball bilan bog'liq signallar olib tashlanadi, daraja qayta hisoblanadi */
export function forManager(result: RiskResult): RiskResult {
  const signals = result.signals.filter((s) =>
    MANAGER_SIGNALS.includes(s.kind),
  );
  return { level: levelOf(signals.length, false), signals };
}

/**
 * "Ko'rib chiqildi" hali amal qiladimi: hideUntil o'tmagan va ko'rib chiqilgandan beri
 * YANGI signal qo'shilmagan. Yangi signal paydo bo'lsa — o'quvchi darhol yana yuqoriga chiqadi
 */
export function isReviewActive(
  review: { hideUntil: DateStr; signalKinds: readonly RiskSignalKind[] },
  current: readonly RiskSignal[],
  today: DateStr,
): boolean {
  if (today >= review.hideUntil) return false;
  return current.every((s) => review.signalKinds.includes(s.kind));
}

const LEVEL_ORDER: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1 };

type RiskRow = { fullName: string; risk: RiskResult; reviewed: boolean };

/** Ro'yxat tartibi: ko'rib chiqilmaganlar yuqorida, keyin daraja, signal soni, ism */
export function compareRisk(a: RiskRow, b: RiskRow): number {
  if (a.reviewed !== b.reviewed) return a.reviewed ? 1 : -1;
  const la = a.risk.level ? LEVEL_ORDER[a.risk.level] : 2;
  const lb = b.risk.level ? LEVEL_ORDER[b.risk.level] : 2;
  if (la !== lb) return la - lb;
  if (a.risk.signals.length !== b.risk.signals.length)
    return b.risk.signals.length - a.risk.signals.length;
  return a.fullName.localeCompare(b.fullName, "uz");
}
