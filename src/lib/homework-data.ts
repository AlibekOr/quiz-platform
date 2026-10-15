import "server-only";
import { db } from "@/lib/db";
import type { AssignmentCategory } from "@/lib/grades";
import {
  defaultHomeworkTitle,
  isLessonTask,
  LESSON_TASK_CATEGORIES,
  lessonTaskConflict,
} from "@/lib/homework";
import {
  addDays,
  fromDbDate,
  nextLessonDate,
  toDbDate,
  todayInTashkent,
  type DateStr,
} from "@/lib/time";

// Uyga vazifa: darsga bog'lash, eslatmalar va o'quvchi ro'yxati (TASKS.md, 4-bo'lim)

/**
 * Topshiriq bog'lanadigan dars shu semestr guruhiga tegishli va semestr sanalari ichida
 * bo'lishi kerak. Xato bo'lsa — matn, aks holda null
 */
export async function lessonMismatch(
  lessonId: string,
  semesterId: string,
): Promise<string | null> {
  const [lesson, semester] = await Promise.all([
    db.lesson.findUnique({
      where: { id: lessonId },
      select: { groupId: true, date: true },
    }),
    db.semester.findUnique({
      where: { id: semesterId },
      select: { groupId: true, startDate: true, endDate: true },
    }),
  ]);
  if (!lesson || !semester) return "Dars topilmadi";
  if (lesson.groupId !== semester.groupId)
    return "Dars boshqa guruhga tegishli";
  if (lesson.date < semester.startDate || lesson.date > semester.endDate)
    return "Dars semestr sanalaridan tashqarida";
  return null;
}

/** Darsga uyga vazifa va amaliy birga berilmaydi (lib/homework.ts). excludeId — tahrirlanayotgani */
export async function lessonTaskMismatch(
  lessonId: string,
  category: AssignmentCategory,
  excludeId?: string,
): Promise<string | null> {
  if (!isLessonTask(category)) return null;
  const existing = await db.assignment.findMany({
    where: {
      lessonId,
      category: { in: [...LESSON_TASK_CATEGORIES] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { category: true },
  });
  return lessonTaskConflict(
    category,
    existing.map((a) => a.category),
  );
}

export type HomeworkPrefill = {
  lessonId: string;
  lessonDate: DateStr;
  groupId: string;
  groupName: string;
  semesterId: string;
  semesterName: string;
  title: string;
  /** Jadval bo'yicha keyingi dars; jadval bo'lmasa — bir haftadan keyin */
  dueDate: DateStr;
};

type LessonRow = {
  id: string;
  date: Date;
  group: {
    id: string;
    name: string;
    schedules: { weekday: number }[];
    semesters: {
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
    }[];
  };
};

const lessonSelect = {
  id: true,
  date: true,
  group: {
    select: {
      id: true,
      name: true,
      schedules: { select: { weekday: true } },
      semesters: {
        select: { id: true, name: true, startDate: true, endDate: true },
      },
    },
  },
} as const;

/** Dars sanasi tushadigan semestr bo'lsa — vazifa dialogi uchun tayyor qiymatlar */
function prefill(lesson: LessonRow): HomeworkPrefill | null {
  const semester = lesson.group.semesters.find(
    (s) => s.startDate <= lesson.date && lesson.date <= s.endDate,
  );
  if (!semester) return null;
  const date = fromDbDate(lesson.date);
  return {
    lessonId: lesson.id,
    lessonDate: date,
    groupId: lesson.group.id,
    groupName: lesson.group.name,
    semesterId: semester.id,
    semesterName: semester.name,
    title: defaultHomeworkTitle(date),
    dueDate:
      nextLessonDate(
        lesson.group.schedules.map((s) => s.weekday),
        date,
      ) ?? addDays(date, 7),
  };
}

/** Bitta dars uchun (uyga vazifa ham, amaliy ham hali berilmagan bo'lsa) tayyor qiymatlar */
export async function getHomeworkPrefill(
  lessonId: string,
): Promise<HomeworkPrefill | null> {
  const lesson = await db.lesson.findFirst({
    where: {
      id: lessonId,
      assignments: { none: { category: { in: [...LESSON_TASK_CATEGORIES] } } },
    },
    select: lessonSelect,
  });
  return lesson ? prefill(lesson) : null;
}

/**
 * Uyga vazifa ham, amaliy ham berilmagan o'tgan darslar (oxirgi `days` kun, bugun ham kiradi), yangilari
 * birinchi. Faqat semestr ichidagi darslar — semestrsiz darsga vazifa berib bo'lmaydi
 */
export async function getMissingHomeworkLessons(
  days = 14,
  today: DateStr = todayInTashkent(),
): Promise<HomeworkPrefill[]> {
  const lessons = await db.lesson.findMany({
    where: {
      date: {
        gte: toDbDate(addDays(today, -(days - 1))),
        lte: toDbDate(today),
      },
      assignments: { none: { category: { in: [...LESSON_TASK_CATEGORIES] } } },
    },
    orderBy: [{ date: "desc" }, { group: { name: "asc" } }],
    select: lessonSelect,
  });
  return lessons.flatMap((l) => {
    const p = prefill(l);
    return p ? [p] : [];
  });
}

export type StudentAssignment = {
  id: string;
  category: AssignmentCategory;
  title: string;
  description: string | null;
  dueDate: DateStr;
  maxPoints: number;
  semesterName: string;
  /** O'z bali (o'qituvchi qo'ygan), qo'yilmagan bo'lsa null */
  points: number | null;
  note: string | null;
};

/**
 * O'quvchining hozirgi guruhi semestrlaridagi topshiriqlar va faqat O'ZINING bali.
 * groupId sessiyadan olinadi (CLAUDE.md, 4-qoida). EXTRA faqat o'ziga qo'yilgan bo'lsa
 */
export async function getStudentAssignments(
  studentId: string,
  groupId: string,
): Promise<StudentAssignment[]> {
  // Guruhga qo'shilishdan oldin muddati tugagan (va baholanmagan) vazifalar ko'rsatilmaydi —
  // o'tkazilgan o'quvchida ular "Bajarilmagan" bo'lib chiqmasin
  const membership = await db.groupMembership.findFirst({
    where: { studentId, groupId, leftAt: null },
    orderBy: { joinedAt: "desc" },
    select: { joinedAt: true },
  });
  const joinedOn = membership ? todayInTashkent(membership.joinedAt) : null;
  const graded = { grades: { some: { studentId } } };
  const rows = await db.assignment.findMany({
    where: {
      semester: { groupId },
      AND: [
        { OR: [{ category: { not: "EXTRA" } }, graded] },
        ...(joinedOn
          ? [{ OR: [{ dueDate: { gte: toDbDate(joinedOn) } }, graded] }]
          : []),
      ],
    },
    orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      category: true,
      title: true,
      description: true,
      dueDate: true,
      maxPoints: true,
      semester: { select: { name: true } },
      grades: {
        where: { studentId },
        select: { points: true, note: true },
      },
    },
  });
  return rows.map((a) => ({
    id: a.id,
    category: a.category,
    title: a.title,
    description: a.description,
    dueDate: fromDbDate(a.dueDate),
    maxPoints: a.maxPoints,
    semesterName: a.semester.name,
    points: a.grades[0]?.points ?? null,
    note: a.grades[0]?.note ?? null,
  }));
}
