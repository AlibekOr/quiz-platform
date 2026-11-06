import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import {
  correctRate,
  findDuplicates,
  normalizeText,
  pickQuestions,
  pickReplacement,
  topicTree,
  topicWithDescendants,
  type BankItem,
  type Difficulty,
  type PickRule,
} from "@/lib/bank";
import { db } from "@/lib/db";
import type { QuestionInput } from "@/lib/validators/test";

// Savollar banki (FEATURES.md, B qism): bazaga yozish va o'qish. Qoidalar — lib/bank.ts.
// Hamma narsa ownerId bo'yicha; boshqa o'qituvchining id'si — null / "FORBIDDEN" (chaqiruvchi 403 qaytaradi)

export type TopicNode = {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  depth: number;
  /** Faqat shu mavzudagi (ichkilarisiz) arxivlanmagan savollar */
  questionCount: number;
};

export async function getTopics(ownerId: string): Promise<TopicNode[]> {
  const topics = await db.topic.findMany({
    where: { ownerId },
    select: {
      id: true,
      name: true,
      parentId: true,
      _count: { select: { questions: { where: { archivedAt: null } } } },
    },
  });
  return topicTree(topics).map((t) => ({
    id: t.id,
    name: t.name,
    parentId: t.parentId,
    path: t.path,
    depth: t.depth,
    questionCount: t._count.questions,
  }));
}

export type BankFilters = {
  q: string;
  topicId: string | null;
  difficulty: Difficulty | null;
  type: "SINGLE" | "MULTIPLE" | null;
  tag: string;
  archived: boolean;
};

export type BankListItem = {
  id: string;
  text: string;
  type: "SINGLE" | "MULTIPLE";
  difficulty: Difficulty;
  points: number;
  explanation: string | null;
  tags: string[];
  topicId: string;
  topicPath: string;
  archived: boolean;
  options: { text: string; isCorrect: boolean }[];
  /** Qaysi testlarda ishlatilgan (nusxalari) */
  tests: { id: string; title: string }[];
  /** To'g'ri javob foizi; urinishlar kam bo'lsa null */
  rate: number | null;
  answers: number;
};

export const BANK_PAGE_SIZE = 100;

export async function listBankQuestions(
  ownerId: string,
  filters: BankFilters,
  topics: TopicNode[],
): Promise<{ items: BankListItem[]; total: number }> {
  const where: Prisma.BankQuestionWhereInput = {
    ownerId,
    archivedAt: filters.archived ? { not: null } : null,
    ...(filters.topicId
      ? { topicId: { in: topicWithDescendants(topics, filters.topicId) } }
      : {}),
    ...(filters.difficulty ? { difficulty: filters.difficulty } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    ...(filters.q
      ? { text: { contains: filters.q, mode: "insensitive" } }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.bankQuestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: BANK_PAGE_SIZE,
      select: {
        id: true,
        text: true,
        type: true,
        difficulty: true,
        points: true,
        explanation: true,
        tags: true,
        topicId: true,
        archivedAt: true,
        options: {
          orderBy: { order: "asc" },
          select: { text: true, isCorrect: true },
        },
        copies: {
          select: { test: { select: { id: true, title: true } } },
        },
      },
    }),
    db.bankQuestion.count({ where }),
  ]);
  const stats = await bankQuestionStats(rows.map((r) => r.id));
  const paths = new Map(topics.map((t) => [t.id, t.path]));
  return {
    total,
    items: rows.map((r) => {
      const s = stats.get(r.id) ?? { attempts: 0, correct: 0 };
      const tests = new Map(r.copies.map((c) => [c.test.id, c.test]));
      return {
        id: r.id,
        text: r.text,
        type: r.type,
        difficulty: r.difficulty,
        points: r.points,
        explanation: r.explanation,
        tags: r.tags,
        topicId: r.topicId,
        topicPath: paths.get(r.topicId) ?? "",
        archived: r.archivedAt !== null,
        options: r.options,
        tests: [...tests.values()],
        rate: correctRate(s),
        answers: s.attempts,
      };
    }),
  };
}

/** Nusxalari bo'yicha javoblar: yakunlangan urinishlardagi javoblar va to'g'rilari */
export async function bankQuestionStats(
  ids: string[],
): Promise<Map<string, { attempts: number; correct: number }>> {
  if (ids.length === 0) return new Map();
  const rows = await db.$queryRaw<
    { id: string; attempts: number; correct: number }[]
  >`
    SELECT q."sourceBankQuestionId" AS id,
           COUNT(*)::int AS attempts,
           COUNT(*) FILTER (WHERE a."isCorrect")::int AS correct
    FROM "Answer" a
    JOIN "Question" q ON q.id = a."questionId"
    JOIN "Attempt" t ON t.id = a."attemptId"
    WHERE q."sourceBankQuestionId" = ANY(${ids})
      AND t.status <> 'IN_PROGRESS'
    GROUP BY q."sourceBankQuestionId"`;
  return new Map(rows.map((r) => [r.id, r]));
}

async function nextOrder(
  tx: Prisma.TransactionClient,
  testId: string,
): Promise<number> {
  const last = await tx.question.aggregate({
    where: { testId },
    _max: { order: true },
  });
  return (last._max.order ?? -1) + 1;
}

/**
 * Bank savollarini testga NUSXA qiladi (sourceBankQuestionId bilan). Keyin bankdagi savol
 * o'zgarsa, test savoli o'zgarmaydi. Boshqa o'qituvchining yoki arxivdagi savoli — FORBIDDEN
 */
export async function copyBankToTest(
  ownerId: string,
  testId: string,
  bankIds: string[],
): Promise<number | "FORBIDDEN"> {
  const unique = [...new Set(bankIds)];
  const rows = await db.bankQuestion.findMany({
    where: { id: { in: unique }, ownerId, archivedAt: null },
    select: {
      id: true,
      text: true,
      type: true,
      points: true,
      options: {
        orderBy: { order: "asc" },
        select: { text: true, isCorrect: true },
      },
    },
  });
  if (rows.length !== unique.length) return "FORBIDDEN";
  const byId = new Map(rows.map((r) => [r.id, r]));
  await db.$transaction(async (tx) => {
    const start = await nextOrder(tx, testId);
    for (const [i, id] of unique.entries()) {
      const q = byId.get(id)!;
      await tx.question.create({
        data: {
          testId,
          text: q.text,
          type: q.type,
          points: q.points,
          order: start + i,
          sourceBankQuestionId: q.id,
          options: {
            create: q.options.map((o, oi) => ({ ...o, order: oi })),
          },
        },
      });
    }
  });
  return unique.length;
}

type NewBankQuestion = {
  question: QuestionInput;
  topicId: string;
  difficulty: Difficulty;
  explanation?: string | null;
  tags?: string[];
};

/** Takroriylarni (bankdagi yoki shu ro'yxatdagi) tashlab, qolganini bankka yozadi */
async function addToBank(
  ownerId: string,
  items: NewBankQuestion[],
): Promise<{ added: number; skipped: number }> {
  const existing = await db.bankQuestion.findMany({
    where: { ownerId },
    select: {
      text: true,
      type: true,
      options: { select: { text: true, isCorrect: true } },
    },
  });
  const duplicates = new Set(
    findDuplicates(
      items.map((i) => ({
        text: i.question.text,
        type: i.question.type,
        options: i.question.options,
      })),
      existing,
    ),
  );
  const fresh = items.filter((_, i) => !duplicates.has(i));
  await db.$transaction(
    fresh.map((item) =>
      db.bankQuestion.create({
        data: {
          ownerId,
          topicId: item.topicId,
          difficulty: item.difficulty,
          text: item.question.text.trim(),
          type: item.question.type,
          points: item.question.points,
          explanation: item.explanation ?? null,
          tags: item.tags ?? [],
          options: {
            create: item.question.options.map((o, oi) => ({
              text: o.text.trim(),
              isCorrect: o.isCorrect,
              order: oi,
            })),
          },
        },
      }),
    ),
  );
  return { added: fresh.length, skipped: duplicates.size };
}

export async function ownsTopic(
  ownerId: string,
  topicId: string,
): Promise<boolean> {
  return (await db.topic.count({ where: { id: topicId, ownerId } })) > 0;
}

/** Test savollarini bankka (bitta mavzu va qiyinlik bilan); takroriylari qo'shilmaydi */
export async function saveTestToBank(
  ownerId: string,
  testId: string,
  target: { topicId: string; difficulty: Difficulty },
): Promise<{ added: number; skipped: number }> {
  const questions = await db.question.findMany({
    where: { testId },
    orderBy: { order: "asc" },
    select: {
      text: true,
      type: true,
      points: true,
      options: {
        orderBy: { order: "asc" },
        select: { text: true, isCorrect: true },
      },
    },
  });
  return addToBank(
    ownerId,
    questions.map((question) => ({ question, ...target })),
  );
}

/**
 * Import: har savolda ixtiyoriy mavzu nomi (yo'q bo'lsa — ildiz mavzu yaratiladi) va qiyinlik;
 * bo'shlari uchun formada tanlangan qiymatlar
 */
export async function importToBank(
  ownerId: string,
  items: {
    question: QuestionInput;
    topic: string;
    difficulty: Difficulty | null;
  }[],
  defaults: { topicId: string; difficulty: Difficulty },
): Promise<{ added: number; skipped: number }> {
  const topics = await getTopics(ownerId);
  const byName = new Map<string, string>();
  // To'liq yo'l ("CSS / Flexbox") yoki faqat nom bo'yicha
  for (const t of topics) {
    byName.set(normalizeText(t.path), t.id);
    if (!byName.has(normalizeText(t.name)))
      byName.set(normalizeText(t.name), t.id);
  }
  const resolved: NewBankQuestion[] = [];
  for (const item of items) {
    let topicId = defaults.topicId;
    const name = item.topic.trim().slice(0, 100);
    if (name) {
      const key = normalizeText(name);
      topicId =
        byName.get(key) ??
        (await db.topic.create({ data: { ownerId, name, parentId: null } }))
          .id;
      byName.set(key, topicId);
    }
    resolved.push({
      question: item.question,
      topicId,
      difficulty: item.difficulty ?? defaults.difficulty,
    });
  }
  return addToBank(ownerId, resolved);
}

export async function createBankQuestion(
  ownerId: string,
  item: NewBankQuestion,
): Promise<{ added: number; skipped: number }> {
  return addToBank(ownerId, [item]);
}

// ---------- Testni bankdan yig'ish ----------

export type PickPreviewItem = {
  id: string;
  text: string;
  difficulty: Difficulty;
  topicPath: string;
  points: number;
};

/** Testga qo'shib bo'lmaydiganlar: shu testda bor, va (excludeUsed) shu guruhlardagi boshqa testlarda */
async function excludedFor(
  testId: string,
  excludeUsed: boolean,
): Promise<Set<string>> {
  const test = await db.test.findUnique({
    where: { id: testId },
    select: { groups: { select: { id: true } } },
  });
  const groupIds = test?.groups.map((g) => g.id) ?? [];
  const used = await db.question.findMany({
    where: {
      sourceBankQuestionId: { not: null },
      OR: [
        { testId },
        ...(excludeUsed && groupIds.length > 0
          ? [{ test: { groups: { some: { id: { in: groupIds } } } } }]
          : []),
      ],
    },
    select: { sourceBankQuestionId: true },
  });
  return new Set(used.flatMap((u) => u.sourceBankQuestionId ?? []));
}

async function pickContext(ownerId: string) {
  const [pool, topics] = await Promise.all([
    db.bankQuestion.findMany({
      where: { ownerId, archivedAt: null },
      select: { id: true, topicId: true, difficulty: true },
    }),
    getTopics(ownerId),
  ]);
  const items: BankItem[] = pool.map((p) => ({ ...p, archived: false }));
  return { items, topics };
}

function toRule(
  topics: TopicNode[],
  rule: { topicId: string; difficulty: Difficulty | null; count: number },
): PickRule {
  return {
    topicIds: topicWithDescendants(topics, rule.topicId),
    difficulty: rule.difficulty,
    count: rule.count,
  };
}

async function previewItems(
  ids: string[],
  topics: TopicNode[],
): Promise<Map<string, PickPreviewItem>> {
  const rows = await db.bankQuestion.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      text: true,
      difficulty: true,
      topicId: true,
      points: true,
    },
  });
  const paths = new Map(topics.map((t) => [t.id, t.path]));
  return new Map(
    rows.map((r) => [
      r.id,
      {
        id: r.id,
        text: r.text,
        difficulty: r.difficulty,
        points: r.points,
        topicPath: paths.get(r.topicId) ?? "",
      },
    ]),
  );
}

/** Qoidalarda boshqa o'qituvchining mavzusi — FORBIDDEN */
export async function pickFromBank(
  ownerId: string,
  testId: string,
  input: {
    rules: { topicId: string; difficulty: Difficulty | null; count: number }[];
    excludeUsed: boolean;
  },
): Promise<
  | "FORBIDDEN"
  | {
      picked: PickPreviewItem[][];
      shortages: { rule: number; missing: number }[];
    }
> {
  const [{ items, topics }, exclude] = await Promise.all([
    pickContext(ownerId),
    excludedFor(testId, input.excludeUsed),
  ]);
  const own = new Set(topics.map((t) => t.id));
  if (input.rules.some((r) => !own.has(r.topicId))) return "FORBIDDEN";
  const result = pickQuestions(
    items,
    input.rules.map((r) => toRule(topics, r)),
    { exclude },
  );
  const preview = await previewItems(result.picked.flat(), topics);
  return {
    picked: result.picked.map((ids) => ids.map((id) => preview.get(id)!)),
    shortages: result.shortages,
  };
}

/** "Boshqasini tanlash": null — almashtiradigan savol qolmagan */
export async function pickOneReplacement(
  ownerId: string,
  testId: string,
  input: {
    rule: { topicId: string; difficulty: Difficulty | null };
    selected: string[];
    excludeUsed: boolean;
  },
): Promise<"FORBIDDEN" | PickPreviewItem | null> {
  const [{ items, topics }, exclude] = await Promise.all([
    pickContext(ownerId),
    excludedFor(testId, input.excludeUsed),
  ]);
  if (!topics.some((t) => t.id === input.rule.topicId)) return "FORBIDDEN";
  const id = pickReplacement(
    items,
    toRule(topics, { ...input.rule, count: 1 }),
    input.selected,
    { exclude },
  );
  if (!id) return null;
  return (await previewItems([id], topics)).get(id) ?? null;
}
