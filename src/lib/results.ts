// Sof funksiyalar: o'qituvchi uchun test natijalari va savollar statistikasi (PLAN.md, 8-bosqich)
import { percent } from "@/lib/format";
import { markFromPercent, type Mark } from "@/lib/grading";
import { formatDateTime, formatDuration } from "@/lib/time";

export type ResultStudent = {
  id: string;
  fullName: string;
  groupName: string | null;
  isActive: boolean;
};

export type ResultAttempt = {
  id: string;
  userId: string;
  status: "IN_PROGRESS" | "FINISHED" | "EXPIRED";
  isFirst: boolean;
  score: number | null;
  maxScore: number | null;
  durationSec: number | null;
  startedAt: Date;
};

export type AttemptSummary = {
  id: string;
  status: "FINISHED" | "EXPIRED";
  score: number;
  maxScore: number;
  percent: number;
  durationSec: number;
  startedAt: Date;
};

export type StudentResultRow = {
  student: ResultStudent;
  /** Yakunlangan urinishlar soni */
  attemptCount: number;
  /** Birinchi urinish (reytingga kiradigan) */
  first: AttemptSummary | null;
  /** Eng yaxshi urinish: foiz yuqori, teng bo'lsa vaqt kam, keyin eng oldingisi */
  best: AttemptSummary | null;
  /** Hozir davom etayotgan urinish */
  inProgressId: string | null;
};

function summarize(a: ResultAttempt): AttemptSummary | null {
  if (a.status === "IN_PROGRESS") return null;
  const score = a.score ?? 0;
  const maxScore = a.maxScore ?? 0;
  return {
    id: a.id,
    status: a.status,
    score,
    maxScore,
    percent: percent(score, maxScore),
    durationSec: a.durationSec ?? 0,
    startedAt: a.startedAt,
  };
}

function isBetter(a: AttemptSummary, b: AttemptSummary): boolean {
  if (a.percent !== b.percent) return a.percent > b.percent;
  if (a.durationSec !== b.durationSec) return a.durationSec < b.durationSec;
  return a.startedAt < b.startedAt;
}

/**
 * Har bir o'quvchi uchun bitta qator. `students` ga urinishi yo'q o'quvchilar ham kiradi
 * (ular "ishlamagan" bo'lib chiqadi); urinishi bor, lekin ro'yxatda yo'q o'quvchi e'tiborga olinmaydi.
 */
export function buildStudentRows(
  students: readonly ResultStudent[],
  attempts: readonly ResultAttempt[],
): StudentResultRow[] {
  const byUser = new Map<string, ResultAttempt[]>();
  for (const a of attempts) {
    const list = byUser.get(a.userId);
    if (list) list.push(a);
    else byUser.set(a.userId, [a]);
  }

  return students.map((student) => {
    const own = byUser.get(student.id) ?? [];
    const done = own.flatMap((a) => {
      const s = summarize(a);
      return s ? [{ attempt: a, summary: s }] : [];
    });
    const best = done.reduce<AttemptSummary | null>(
      (acc, d) => (acc === null || isBetter(d.summary, acc) ? d.summary : acc),
      null,
    );
    return {
      student,
      attemptCount: done.length,
      first: done.find((d) => d.attempt.isFirst)?.summary ?? null,
      best,
      inProgressId: own.find((a) => a.status === "IN_PROGRESS")?.id ?? null,
    };
  });
}

export const RESULT_SORTS = [
  "first",
  "best",
  "time",
  "attempts",
  "name",
] as const;
export type ResultSort = (typeof RESULT_SORTS)[number];
export type SortDir = "asc" | "desc";

/** Standart yo'nalish: ballar kamayish bo'yicha, ism va vaqt o'sish bo'yicha */
export function defaultDir(sort: ResultSort): SortDir {
  return sort === "name" || sort === "time" ? "asc" : "desc";
}

function sortValue(row: StudentResultRow, sort: ResultSort): number | null {
  switch (sort) {
    case "first":
      return row.first?.percent ?? null;
    case "best":
      return row.best?.percent ?? null;
    case "time":
      return row.first?.durationSec ?? null;
    case "attempts":
      return row.attemptCount;
    case "name":
      return null;
  }
}

/** Qiymati yo'q qatorlar (ishlamaganlar) yo'nalishdan qat'i nazar oxirida; teng bo'lsa ism bo'yicha */
export function sortRows(
  rows: readonly StudentResultRow[],
  sort: ResultSort,
  dir: SortDir,
): StudentResultRow[] {
  const sign = dir === "asc" ? 1 : -1;
  const byName = (a: StudentResultRow, b: StudentResultRow) =>
    a.student.fullName.localeCompare(b.student.fullName, "uz");

  return [...rows].sort((a, b) => {
    if (sort === "name") return sign * byName(a, b);
    const va = sortValue(a, sort);
    const vb = sortValue(b, sort);
    if (va === null || vb === null) {
      if (va !== vb) return va === null ? 1 : -1;
      return byName(a, b);
    }
    if (va !== vb) return sign * (va - vb);
    // Teng foizda reytingdagidek: vaqt kamrog'i yuqorida
    if (sort === "first" || sort === "best") {
      const ta = (sort === "first" ? a.first : a.best)?.durationSec ?? 0;
      const tb = (sort === "first" ? b.first : b.best)?.durationSec ?? 0;
      if (ta !== tb) return ta - tb;
    }
    return byName(a, b);
  });
}

// ---------- Savollar statistikasi ----------

export type StatQuestion = {
  id: string;
  text: string;
  type: "SINGLE" | "MULTIPLE";
  points: number;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export type StatAnswer = {
  questionId: string;
  selectedOptionIds: readonly string[];
  isCorrect: boolean | null;
};

export type QuestionStat = {
  id: string;
  /** Testdagi tartib raqami (1 dan) */
  number: number;
  text: string;
  type: "SINGLE" | "MULTIPLE";
  correct: number;
  /** Javob berganlar (kamida bitta variant tanlagan) */
  answered: number;
  /** Hisobga olingan urinishlar soni */
  total: number;
  /** To'g'ri javoblar foizi; javob bermaganlar noto'g'ri hisoblanadi */
  percent: number;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    picks: number;
    percent: number;
  }[];
};

/**
 * @param answers hisobga olinadigan urinishlardagi javoblar (odatda faqat birinchi urinishlar)
 * @param total shu urinishlar soni
 */
export function computeQuestionStats(
  questions: readonly StatQuestion[],
  answers: readonly StatAnswer[],
  total: number,
): QuestionStat[] {
  const byQuestion = new Map<string, StatAnswer[]>();
  for (const a of answers) {
    const list = byQuestion.get(a.questionId);
    if (list) list.push(a);
    else byQuestion.set(a.questionId, [a]);
  }

  return questions.map((q, i) => {
    const list = byQuestion.get(q.id) ?? [];
    const picks = new Map<string, number>();
    let answered = 0;
    let correct = 0;
    for (const a of list) {
      if (a.selectedOptionIds.length > 0) answered++;
      if (a.isCorrect === true) correct++;
      for (const id of new Set(a.selectedOptionIds))
        picks.set(id, (picks.get(id) ?? 0) + 1);
    }
    return {
      id: q.id,
      number: i + 1,
      text: q.text,
      type: q.type,
      correct,
      answered,
      total,
      percent: percent(correct, total),
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
        picks: picks.get(o.id) ?? 0,
        percent: percent(picks.get(o.id) ?? 0, total),
      })),
    };
  });
}

/** Eng qiyin savollar: to'g'ri javob foizi eng past; teng bo'lsa tartib bo'yicha */
export function hardestQuestions(
  stats: readonly QuestionStat[],
  count = 5,
): QuestionStat[] {
  return stats
    .filter((s) => s.total > 0)
    .toSorted((a, b) => a.percent - b.percent || a.number - b.number)
    .slice(0, count);
}

// ---------- CSV eksport ----------

/**
 * CSV katagi: ajratgich, qo'shtirnoq yoki qator bo'lsa qo'shtirnoqqa olinadi.
 * =, +, -, @ bilan boshlangan matn formula bo'lib ketmasligi uchun oldiga ' qo'yiladi.
 */
export function csvCell(value: string | number): string {
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Baho yozuvi (jadval va CSV uchun) */
export const MARK_LABEL: Record<Mark, string> = {
  5: "5",
  4: "4",
  fail: "O'tmadi",
};

const STATUS_LABEL = {
  FINISHED: "Topshirilgan",
  EXPIRED: "Vaqt tugagan",
} as const;

/**
 * Natijalar jadvali CSV ko'rinishida. Ajratgich ";" — o'zbek/rus lokalidagi Excel uni
 * to'g'ridan-to'g'ri ustunlarga ajratadi. Boshidagi BOM Excel'ga UTF-8 ekanini bildiradi.
 */
export function buildResultsCsv(rows: readonly StudentResultRow[]): string {
  const header = [
    "№",
    "F.I.Sh.",
    "Guruh",
    "Birinchi urinish: ball",
    "Maks. ball",
    "Foiz",
    "Baho",
    "Vaqt",
    "Holat",
    "Sana",
    "Eng yaxshi ball",
    "Eng yaxshi foiz",
    "Urinishlar soni",
  ];
  const lines = rows.map((r, i) => {
    const f = r.first;
    return [
      i + 1,
      r.student.fullName,
      r.student.groupName ?? "",
      f ? f.score : "",
      f ? f.maxScore : "",
      f ? `${f.percent}%` : "",
      f ? MARK_LABEL[markFromPercent(f.percent)] : "",
      f ? formatDuration(f.durationSec) : "",
      f
        ? STATUS_LABEL[f.status]
        : r.inProgressId
          ? "Davom etmoqda"
          : "Ishlamagan",
      f ? formatDateTime(f.startedAt) : "",
      r.best ? r.best.score : "",
      r.best ? `${r.best.percent}%` : "",
      r.attemptCount,
    ]
      .map(csvCell)
      .join(";");
  });
  return `﻿${[header.map(csvCell).join(";"), ...lines].join("\r\n")}\r\n`;
}
