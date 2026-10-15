import { CATEGORY_LABEL, type AssignmentCategory } from "@/lib/grades";
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

/** Darsdan yaratiladigan vazifaning default nomi: "Uyga vazifa — 11.10", "Amaliy — 11.10" */
export function defaultHomeworkTitle(
  lessonDate: DateStr,
  category: AssignmentCategory = "HOMEWORK",
): string {
  return `${CATEGORY_LABEL[category]} — ${formatDayMonth(lessonDate)}`;
}

/**
 * Darsning vazifasi: uyga vazifa yoki amaliy topshiriq. Amaliy berilgan darsga uyga vazifa
 * berilmaydi (amaliy uning o'rnida), uyga vazifa berilganiga — amaliy
 */
export const LESSON_TASK_CATEGORIES = ["HOMEWORK", "PRACTICAL"] as const;

export function isLessonTask(category: AssignmentCategory): boolean {
  return (LESSON_TASK_CATEGORIES as readonly string[]).includes(category);
}

/** Darsda boshqa turdagi vazifa bor bo'lsa — xato matni, aks holda null */
export function lessonTaskConflict(
  category: AssignmentCategory,
  existing: readonly AssignmentCategory[],
): string | null {
  if (category === "HOMEWORK" && existing.includes("PRACTICAL"))
    return "Bu darsga amaliy topshiriq berilgan — u uyga vazifa o'rnida, uyga vazifa berilmaydi";
  if (category === "PRACTICAL" && existing.includes("HOMEWORK"))
    return "Bu darsga uyga vazifa berilgan. Amaliy uning o'rniga beriladi: uyga vazifaning turini \"Amaliy\" qiling yoki uni o'chiring";
  return null;
}
