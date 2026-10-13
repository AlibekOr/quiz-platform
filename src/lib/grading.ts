// Sof funksiyalar: baholash va attempt vaqt qoidalari (PLAN.md "Biznes qoidalar")

export const DEADLINE_GRACE_MS = 5_000;

export type GradableQuestion = {
  id: string;
  type: "SINGLE" | "MULTIPLE";
  points: number;
  options: { id: string; isCorrect: boolean }[];
};

/**
 * Tanlangan variantlar to'plami to'g'ri variantlar to'plamiga aynan teng bo'lsagina to'g'ri.
 * SINGLE uchun ham shu qoida: to'g'ri variant bitta, demak aynan o'sha bitta tanlangan bo'lishi kerak.
 * Qisman ball yo'q.
 */
export function isAnswerCorrect(
  question: GradableQuestion,
  selectedOptionIds: readonly string[] | undefined,
): boolean {
  if (!selectedOptionIds || selectedOptionIds.length === 0) return false;
  const selected = new Set(selectedOptionIds);
  const correct = new Set(
    question.options.filter((o) => o.isCorrect).map((o) => o.id),
  );
  if (correct.size === 0 || selected.size !== correct.size) return false;
  for (const id of selected) if (!correct.has(id)) return false;
  return true;
}

export type GradeResult = {
  score: number;
  maxScore: number;
  /** questionId -> to'g'rimi; javob berilmagan savollar false */
  correctness: Map<string, boolean>;
};

export function gradeAttempt(
  questions: readonly GradableQuestion[],
  answers: ReadonlyMap<string, readonly string[]>,
): GradeResult {
  let score = 0;
  let maxScore = 0;
  const correctness = new Map<string, boolean>();
  for (const q of questions) {
    maxScore += q.points;
    const ok = isAnswerCorrect(q, answers.get(q.id));
    correctness.set(q.id, ok);
    if (ok) score += q.points;
  }
  return { score, maxScore, correctness };
}

/** O'tish chegarasi: shundan past bo'lsa testdan o'tmagan */
export const PASS_PERCENT = 60;
/** 5 baho chegarasi */
export const EXCELLENT_PERCENT = 90;

export type Mark = "fail" | 4 | 5;

/** Foizdan baho: < 60 — o'tmadi, 60–89 — 4, 90–100 — 5 (foiz ekrandagi kabi butun son) */
export function markFromPercent(percent: number): Mark {
  if (percent >= EXCELLENT_PERCENT) return 5;
  if (percent >= PASS_PERCENT) return 4;
  return "fail";
}

/** Deadline + 5s gacha javob va topshirish qabul qilinadi */
export function isWithinDeadline(deadlineAt: Date, now: Date): boolean {
  return now.getTime() <= deadlineAt.getTime() + DEADLINE_GRACE_MS;
}

/** Sarflangan vaqt (soniya): test vaqtidan oshmaydi, manfiy bo'lmaydi */
export function computeDurationSec(
  startedAt: Date,
  finishedAt: Date,
  durationMin: number,
): number {
  const sec = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);
  return Math.min(Math.max(sec, 0), durationMin * 60);
}

/** Fisher–Yates; random parametri testlar uchun */
export function shuffle<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Satrdan takrorlanuvchi tasodifiy sonlar (FNV-1a hash + mulberry32) */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bir xil urug' — har doim bir xil tartib */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  return shuffle(items, seededRandom(seed));
}

/**
 * Urinishdagi variantlar tartibi: aralashtirish yoqilgan bo'lsa attemptId + questionId
 * urug'idan (sahifa yangilansa ham o'zgarmaydi), aks holda asl tartib
 */
export function optionOrderFor<T>(
  attempt: { id: string; shuffleOptions: boolean },
  questionId: string,
  options: readonly T[],
): T[] {
  return attempt.shuffleOptions
    ? seededShuffle(options, `${attempt.id}:${questionId}`)
    : [...options];
}
