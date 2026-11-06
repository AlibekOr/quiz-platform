import { departureLabel, type Departure } from "@/lib/memberships";
import { addDays, type DateStr } from "@/lib/time";

// Semestr bali (PLAN.md, 17-bosqich; ROLES.md §5). Sof funksiyalar — testlar bilan.
// Qoidalar semestrning o'z nusxasidan (shablondan olingan snapshot) keladi:
//
//   counted(k) = min(earned(k), cap(k))           // cap = null — chegarasiz
//   base       = Σ counted (EXTRA'dan tashqari) + tuzatishlar
//   capped     = min(base, maxTotal)
//   withExtra  = extraBeyondMax ? capped + extra : min(capped + extra, maxTotal)
//   total      = max(0, withExtra − jarimalar)
//   passScore  = maxTotal * passPercent / 100   // 36
//
// Testlar semestr baliga kirmaydi.

/** Kategoriya turi (prisma GradeKind). ORAL — davomat varag'ida, qolganlari — topshiriq */
export type GradeKind =
  "HOMEWORK" | "PRACTICAL" | "ASSIGNMENT" | "ORAL" | "EXTRA" | "BONUS";

/** Topshiriq turi (prisma AssignmentCategory) — og'zakidan boshqa hammasi */
export type AssignmentCategory = Exclude<GradeKind, "ORAL">;

/** ANYTIME — istalgan vaqtda, istalgan o'quvchiga; AFTER_END_BAND — tugagach, [failBelow, o'tish) */
export type ExtraMode = "ANYTIME" | "AFTER_END_BAND";

export type CategoryRule = {
  id: string;
  name: string;
  kind: GradeKind;
  /** Jamiga kiradigan eng ko'p ball; null — chegarasiz */
  cap: number | null;
  /** Bitta topshiriq (og'zaki — bitta dars) uchun ball oralig'i va qadami */
  itemMin: number;
  itemMax: number;
  step: number;
};

export type SemesterRules = {
  maxTotal: number;
  passPercent: number;
  failBelow: number;
  extraMode: ExtraMode;
  /** true — jami maxTotal dan faqat EXTRA hisobiga oshishi mumkin */
  extraBeyondMax: boolean;
  categories: CategoryRule[];
};

/** Shablon (yoki semestr) kategoriyasi — id'siz */
export type CategoryDraft = Omit<CategoryRule, "id">;

export type TemplateDraft = Omit<SemesterRules, "categories"> & {
  name: string;
  categories: CategoryDraft[];
};

/** Yangi o'qituvchi uchun standart shablon (ROLES.md §5: eski 60/36/10, 30/20/10/40 tizimi) */
export const DEFAULT_TEMPLATE: TemplateDraft = {
  name: "Asosiy",
  maxTotal: 60,
  passPercent: 60,
  failBelow: 10,
  extraMode: "AFTER_END_BAND",
  extraBeyondMax: false,
  categories: [
    {
      name: "Uyga vazifa",
      kind: "HOMEWORK",
      cap: 30,
      itemMin: 0,
      itemMax: 1,
      step: 0.5,
    },
    {
      name: "Amaliy",
      kind: "PRACTICAL",
      cap: 20,
      itemMin: 0,
      itemMax: 100,
      step: 0.5,
    },
    {
      name: "Og'zaki",
      kind: "ORAL",
      cap: 10,
      itemMin: 0,
      itemMax: 1,
      step: 0.5,
    },
    {
      name: "Qo'shimcha",
      kind: "EXTRA",
      cap: 40,
      itemMin: 0,
      itemMax: 100,
      step: 0.5,
    },
    {
      name: "Bonus",
      kind: "BONUS",
      cap: null,
      itemMin: 0,
      itemMax: 100,
      step: 0.5,
    },
  ],
};

/** Shablondan qoidalar (testlar va oldindan ko'rish uchun): id = tartib raqami */
export function rulesOf(template: TemplateDraft): SemesterRules {
  return {
    ...template,
    categories: template.categories.map((c, i) => ({ ...c, id: `c${i}` })),
  };
}

/** Kategoriyalar bo'yicha yig'ilgan xom ballar (chegarasiz) */
export type PointSums = {
  /** categoryId -> yig'indi (og'zaki — ORAL kategoriyasi id'si bo'yicha) */
  byCategory: Readonly<Record<string, number>>;
  /** Tuzatishlar yig'indisi (manfiy ham bo'lishi mumkin) */
  adjustments: number;
  /** Jarimalar yig'indisi (musbat son, ayiriladi) */
  penalties: number;
};

export type SemesterStatus =
  "IN_PROGRESS" | "PASSED" | "EXTRA_CHANCE" | "FAILED";

export type CategoryResult = {
  id: string;
  name: string;
  kind: GradeKind;
  /** Yig'ilgan xom ball */
  earned: number;
  /** Chegara (null — chegarasiz) */
  cap: number | null;
  /** Jamiga kirgan qismi: min(earned, cap) */
  counted: number;
};

export type SemesterResult = {
  /** Semestr kategoriyalari tartibida */
  categories: CategoryResult[];
  adjustments: number;
  penalties: number;
  /** Jarimalardan oldingi yig'indi (EXTRA bilan) — reytingdagi "To'plagan" */
  earned: number;
  /** EXTRA'siz jami (jarimalardan keyin, >= 0) — "Qo'shimcha imkoniyat" / "Yiqildi" shundan */
  withoutExtra: number;
  /** Yakuniy jami, >= 0 */
  total: number;
  maxTotal: number;
  passScore: number;
  status: SemesterStatus;
  /** Shu o'quvchiga hozir EXTRA ball qo'yish mumkinmi (semestr qoidasi bo'yicha) */
  canReceiveExtra: boolean;
};

/** 0.1 gacha yaxlitlash */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** O'tish bali: 60 * 60% = 36 */
export function passScore(rules: {
  maxTotal: number;
  passPercent: number;
}): number {
  return round1((rules.maxTotal * rules.passPercent) / 100);
}

/** Semestr tugaganmi: o'qituvchi yopgan yoki oxirgi kuni o'tgan (Toshkent kuni) */
export function isSemesterEnded(
  semester: { endDate: DateStr; closed: boolean },
  today: DateStr,
): boolean {
  return semester.closed || today > semester.endDate;
}

/** EXTRA ruxsati: ANYTIME — doim; AFTER_END_BAND — tugagach va [failBelow, o'tish) oralig'ida */
export function canReceiveExtra(
  rules: Pick<
    SemesterRules,
    "extraMode" | "failBelow" | "maxTotal" | "passPercent"
  >,
  withoutExtra: number,
  ended: boolean,
): boolean {
  if (rules.extraMode === "ANYTIME") return true;
  return (
    ended && withoutExtra >= rules.failBelow && withoutExtra < passScore(rules)
  );
}

export function computeSemesterResult(
  rules: SemesterRules,
  sums: PointSums,
  ended: boolean,
): SemesterResult {
  const categories = rules.categories.map((c): CategoryResult => {
    const earned = round1(sums.byCategory[c.id] ?? 0);
    return {
      id: c.id,
      name: c.name,
      kind: c.kind,
      earned,
      cap: c.cap,
      counted: c.cap === null ? earned : Math.min(earned, c.cap),
    };
  });
  const adjustments = round1(sums.adjustments);
  const penalties = round1(sums.penalties);
  const sumOf = (extra: boolean) =>
    categories
      .filter((c) => (c.kind === "EXTRA") === extra)
      .reduce((s, c) => s + c.counted, 0);

  const capped = Math.min(sumOf(false) + adjustments, rules.maxTotal);
  const withExtra = rules.extraBeyondMax
    ? capped + sumOf(true)
    : Math.min(capped + sumOf(true), rules.maxTotal);
  const withoutExtra = round1(Math.max(0, capped - penalties));
  const total = round1(Math.max(0, withExtra - penalties));
  const pass = passScore(rules);
  const extraAllowed = canReceiveExtra(rules, withoutExtra, ended);

  let status: SemesterStatus;
  if (!ended) status = "IN_PROGRESS";
  else if (total >= pass) status = "PASSED";
  else if (withoutExtra >= rules.failBelow) status = "EXTRA_CHANCE";
  else status = "FAILED";

  return {
    categories,
    adjustments,
    penalties,
    earned: round1(withExtra),
    withoutExtra,
    total,
    maxTotal: rules.maxTotal,
    passScore: pass,
    status,
    canReceiveExtra: extraAllowed,
  };
}

/** Ball kategoriya oralig'ida va qadamida; HOMEWORK'dan boshqasida topshiriq maxPoints dan oshmaydi */
export function isValidPoints(
  rule: Pick<CategoryRule, "kind" | "itemMin" | "itemMax" | "step">,
  points: number,
  maxPoints: number,
): boolean {
  if (!Number.isFinite(points) || points < rule.itemMin) return false;
  const max =
    rule.kind === "HOMEWORK" || rule.kind === "ORAL"
      ? rule.itemMax
      : Math.min(maxPoints, rule.itemMax);
  if (points > max) return false;
  const steps = (points - rule.itemMin) / rule.step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

/** Ball tugmalari (0 / 0,5 / 1) yoki son maydoni: qiymatlar 5 tadan ko'p bo'lmasa — tugmalar */
export function pointChoices(
  rule: Pick<CategoryRule, "itemMin" | "itemMax" | "step">,
  maxPoints: number = rule.itemMax,
): number[] | null {
  const max = Math.min(maxPoints, rule.itemMax);
  const count = Math.floor((max - rule.itemMin) / rule.step + 1e-9) + 1;
  if (count > 5 || count < 1) return null;
  return Array.from({ length: count }, (_, i) =>
    round1(rule.itemMin + i * rule.step),
  );
}

/** Topshiriq formasi uchun semestr kategoriyasi (og'zakisiz) */
export type AssignmentCategoryOption = {
  id: string;
  name: string;
  kind: AssignmentCategory;
  itemMax: number;
};

/** Semestr tanlovi: kategoriyalari bilan (kategoriyalar semestrga xos — snapshot) */
export type SemesterOption = {
  id: string;
  name: string;
  categories: AssignmentCategoryOption[];
};

/** Prisma qatoridan (kind: GradeKind) — og'zaki chiqarib tashlanadi */
export function assignmentCategoryOptions(
  rows: readonly {
    id: string;
    name: string;
    kind: GradeKind;
    itemMax: number;
  }[],
): AssignmentCategoryOption[] {
  return rows.flatMap((c) =>
    c.kind === "ORAL"
      ? []
      : [{ id: c.id, name: c.name, kind: c.kind, itemMax: c.itemMax }],
  );
}

/** "Uyga vazifa 30 · Amaliy 20 · Bonus chegarasiz · qo'shimcha: istalgan vaqtda, 60 dan oshishi mumkin" */
export function rulesSummary(rules: {
  categories: readonly Pick<CategoryRule, "name" | "cap">[];
  extraMode: ExtraMode;
  extraBeyondMax: boolean;
  maxTotal: number;
}): string {
  const categories = rules.categories
    .map(
      (c) => `${c.name} ${c.cap === null ? "chegarasiz" : formatPoints(c.cap)}`,
    )
    .join(" · ");
  const extra =
    rules.extraMode === "ANYTIME"
      ? "qo'shimcha: istalgan vaqtda"
      : "qo'shimcha: tugagach, o'tolmaganlarga";
  const beyond = rules.extraBeyondMax
    ? `, ${rules.maxTotal} dan oshishi mumkin`
    : "";
  return `${categories} · ${extra}${beyond}`;
}

export const KIND_LABEL: Record<GradeKind, string> = {
  HOMEWORK: "Uyga vazifa (darsga)",
  PRACTICAL: "Amaliy (darsga, uyga vazifa o'rnida)",
  ASSIGNMENT: "Topshiriq",
  ORAL: "Og'zaki (davomatda)",
  EXTRA: "Qo'shimcha",
  BONUS: "Bonus",
};

/** Bir shablonda bittadan bo'ladigan turlar (ASSIGNMENT — istalgancha) */
export const SINGLE_KINDS: readonly GradeKind[] = [
  "HOMEWORK",
  "PRACTICAL",
  "ORAL",
  "EXTRA",
  "BONUS",
];

/** 12 -> "12", 12.5 -> "12,5" */
export function formatPoints(points: number): string {
  return String(round1(points)).replace(".", ",");
}

export function signedPoints(points: number): string {
  return points > 0 ? `+${formatPoints(points)}` : formatPoints(points);
}

/** "12,5 / 30" (BONUS uchun faqat ball) */
export function categoryText(
  c: Pick<CategoryResult, "earned" | "cap">,
): string {
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

export const STATUS_LABEL: Record<SemesterStatus, string> = {
  IN_PROGRESS: "Jarayonda",
  PASSED: "O'tdi",
  EXTRA_CHANCE: "Qo'shimcha imkoniyat",
  FAILED: "Yiqildi",
};

/**
 * Semestr reytingi tartibi: avval normativdan o'tganlar, keyin normativdan pastlar
 * (belowNorm); har biri ichida jami ball kamayish bo'yicha, teng ballga bir xil o'rin
 * (RANK: 1, 1, 3), teng bo'lsa alifbo bo'yicha. O'rinlar uzluksiz davom etadi
 */
export function rankByTotal<
  T extends { total: number; fullName: string; belowNorm?: boolean },
>(rows: readonly T[]): (T & { rank: number })[] {
  const below = (r: T) => Number(r.belowNorm ?? false);
  const sorted = [...rows].sort(
    (a, b) =>
      below(a) - below(b) ||
      b.total - a.total ||
      a.fullName.localeCompare(b.fullName, "uz"),
  );
  let rank = 0;
  return sorted.map((r, i) => {
    const prev = sorted[i - 1];
    if (i === 0 || r.total !== prev.total || below(r) !== below(prev))
      rank = i + 1;
    return { ...r, rank };
  });
}

/** Semestr oxirgi 2 haftasi (oxirgi 14 kun, endDate ham kiradi) — normativdan pastlar ajratiladi */
export const FINAL_STRETCH_DAYS = 14;

export function isFinalStretch(
  semester: { endDate: DateStr },
  today: DateStr,
): boolean {
  return (
    today >= addDays(semester.endDate, -(FINAL_STRETCH_DAYS - 1)) &&
    today <= semester.endDate
  );
}

/**
 * Avtomatik jarima: darsga sababsiz kelmaslik — −1. Uyga vazifaga 0 — vazifaning
 * missPenalty si (2026-10-15 dan beri −2, undan oldin berilganlarda −1)
 */
export const ABSENCE_PENALTY_POINTS = 1;

export type AutoPenalty = {
  id: string;
  points: number;
  name: string;
  note: string | null;
  date: DateStr;
};

/** Avtomatik jarimalar (bazaga yozilmaydi, har safar hisoblanadi); yangilari birinchi */
export function autoPenalties(input: {
  zeroHomework: readonly {
    assignmentId: string;
    title: string;
    dueDate: DateStr;
    missPenalty: number;
  }[];
  absences: readonly { lessonId: string; date: DateStr }[];
}): AutoPenalty[] {
  return [
    ...input.zeroHomework.map((h) => ({
      id: `auto:hw:${h.assignmentId}`,
      points: h.missPenalty,
      name: "Uyga vazifa bajarilmagan",
      note: h.title,
      date: h.dueDate,
    })),
    ...input.absences.map((a) => ({
      id: `auto:abs:${a.lessonId}`,
      points: ABSENCE_PENALTY_POINTS,
      name: "Darsga sababsiz kelmadi",
      note: null,
      date: a.date,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
}
