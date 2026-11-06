import { shuffle } from "@/lib/grading";

// Savollar banki (FEATURES.md, B qism). Sof funksiyalar — testlar bilan.
// Bazaga yozish, doira (ownerId) va nusxalash chaqiruvchida.

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: "Oson",
  MEDIUM: "O'rta",
  HARD: "Qiyin",
};

// ---------- Takroriy savollar ----------

export type QuestionShape = {
  text: string;
  type: "SINGLE" | "MULTIPLE";
  options: readonly { text: string; isCorrect: boolean }[];
};

/** Solishtirish uchun: kichik harf, ortiqcha bo'shliqlar va apostrof turlari bir xil */
export function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[ʻʼ‘’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Bir xil matn, tur va variantlar (tartibi muhim emas, to'g'ri belgisi bilan) — bir xil iz.
 * Variantlar aralashtirib saqlangan savol ham takroriy deb topiladi
 */
export function questionFingerprint(q: QuestionShape): string {
  const options = q.options
    .map((o) => `${o.isCorrect ? "+" : "-"}${normalizeText(o.text)}`)
    .sort();
  return JSON.stringify([normalizeText(q.text), q.type, options]);
}

/**
 * Yangi savollardan qaysilari takroriy: bankda bor yoki shu ro'yxatda oldinroq kelgan.
 * Takroriylarning indekslari qaytadi
 */
export function findDuplicates(
  candidates: readonly QuestionShape[],
  existing: readonly QuestionShape[],
): number[] {
  const seen = new Set(existing.map(questionFingerprint));
  const duplicates: number[] = [];
  candidates.forEach((q, i) => {
    const fp = questionFingerprint(q);
    if (seen.has(fp)) duplicates.push(i);
    else seen.add(fp);
  });
  return duplicates;
}

// ---------- Mavzular daraxti ----------

/** Mavzu va uning barcha ichki mavzulari (sikl bo'lsa ham to'xtaydi) */
export function topicWithDescendants(
  topics: readonly { id: string; parentId: string | null }[],
  rootId: string,
): string[] {
  const children = new Map<string, string[]>();
  for (const t of topics) {
    if (t.parentId === null) continue;
    children.set(t.parentId, [...(children.get(t.parentId) ?? []), t.id]);
  }
  const result: string[] = [];
  const visited = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    result.push(id);
    stack.push(...(children.get(id) ?? []));
  }
  return result;
}

// ---------- Testni bankdan avtomatik yig'ish ----------

export type BankItem = {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  archived: boolean;
};

export type PickRule = {
  /** Mavzu va ichki mavzulari (topicWithDescendants) */
  topicIds: readonly string[];
  difficulty: Difficulty | null;
  count: number;
};

export type PickResult = {
  /** Har qoida uchun tanlangan savollar (qoidalar tartibida) */
  picked: string[][];
  /** Yetishmayotganlar: qoida indeksi va nechta kam */
  shortages: { rule: number; missing: number }[];
};

function matches(item: BankItem, rule: PickRule): boolean {
  return (
    !item.archived &&
    rule.topicIds.includes(item.topicId) &&
    (rule.difficulty === null || item.difficulty === rule.difficulty)
  );
}

/**
 * Qoidalar bo'yicha tasodifiy tanlash: arxivlanganlar va `exclude` (masalan, shu guruhda oldin
 * ishlatilganlar) olinmaydi, bitta savol ikki qoidaga tushmaydi. Yetmasa — nechtasi kamligi
 */
export function pickQuestions(
  pool: readonly BankItem[],
  rules: readonly PickRule[],
  options: { exclude?: ReadonlySet<string>; random?: () => number } = {},
): PickResult {
  const taken = new Set(options.exclude ?? []);
  const picked: string[][] = [];
  const shortages: PickResult["shortages"] = [];
  rules.forEach((rule, index) => {
    const available = pool.filter(
      (item) => !taken.has(item.id) && matches(item, rule),
    );
    const chosen = shuffle(available, options.random)
      .slice(0, rule.count)
      .map((item) => item.id);
    chosen.forEach((id) => taken.add(id));
    picked.push(chosen);
    if (chosen.length < rule.count)
      shortages.push({ rule: index, missing: rule.count - chosen.length });
  });
  return { picked, shortages };
}

/**
 * "Boshqasini tanlash": qoidaga mos, hali tanlanmagan va chiqarilmagan boshqa savol.
 * null — almashtiradigan savol qolmagan
 */
export function pickReplacement(
  pool: readonly BankItem[],
  rule: PickRule,
  selected: readonly string[],
  options: { exclude?: ReadonlySet<string>; random?: () => number } = {},
): string | null {
  const blocked = new Set([...selected, ...(options.exclude ?? [])]);
  const available = pool.filter(
    (item) => !blocked.has(item.id) && matches(item, rule),
  );
  return shuffle(available, options.random)[0]?.id ?? null;
}

// ---------- Statistika ----------

/** Kamida shuncha urinishdan keyin ko'rsatiladi */
export const MIN_ATTEMPTS_FOR_STATS = 10;

/** To'g'ri javob foizi; urinishlar kam bo'lsa null */
export function correctRate(stats: {
  attempts: number;
  correct: number;
}): number | null {
  if (stats.attempts < MIN_ATTEMPTS_FOR_STATS) return null;
  return Math.round((stats.correct / stats.attempts) * 100);
}
