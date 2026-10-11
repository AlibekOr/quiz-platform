import { formatDayMonth, type DateStr } from "@/lib/time";

// Uyga vazifa holati va eslatmalar (TASKS.md, 4-bo'lim). O'quvchi saytda hech narsa
// topshirmaydi: holat o'qituvchi qo'ygan balldan va muddatdan aniqlanadi

export type HomeworkStatus = "DONE" | "PENDING" | "MISSED";

/**
 * Bajarildi — 0 dan katta ball; Bajarilmagan — 0 ball yoki muddat kuni o'tib ball yo'q;
 * Kutilmoqda — ball yo'q va muddat hali o'tmagan (muddat kunining o'zi ham)
 */
export function homeworkStatus(
  points: number | null,
  dueDate: DateStr,
  today: DateStr,
): HomeworkStatus {
  if (points !== null) return points > 0 ? "DONE" : "MISSED";
  return today > dueDate ? "MISSED" : "PENDING";
}

export const HOMEWORK_STATUS_LABEL: Record<HomeworkStatus, string> = {
  DONE: "Bajarildi",
  PENDING: "Kutilmoqda",
  MISSED: "Bajarilmagan",
};

/** Uyga vazifa bog'lanmagan darslar (eslatma uchun) */
export function lessonsWithoutHomework<L extends { id: string }>(
  lessons: readonly L[],
  linkedLessonIds: Iterable<string>,
): L[] {
  const linked = new Set(linkedLessonIds);
  return lessons.filter((l) => !linked.has(l.id));
}

/** Darsdan yaratiladigan vazifaning default nomi: "Uyga vazifa — 11.10" */
export function defaultHomeworkTitle(lessonDate: DateStr): string {
  return `Uyga vazifa — ${formatDayMonth(lessonDate)}`;
}
