import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  autoPenalties,
  computeSemesterResult,
  isSemesterEnded,
  type AssignmentCategory,
  type PointSums,
  type SemesterResult,
  type SemesterRules,
} from "@/lib/grades";
import { describeDeparture, type Departure } from "@/lib/memberships";
import { membershipOverlapWhere } from "@/lib/memberships-data";
import {
  fromDbDate,
  toDbDate,
  todayInTashkent,
  type DateStr,
} from "@/lib/time";

// Semestr ballari uchun ma'lumot yig'ish. O'quvchi uchun chaqirilganda faqat o'zi bo'ladi
// (boshqalarning ballari yuborilmaydi); aloqa ma'lumotlari umuman olinmaydi

const semesterSelect = {
  id: true,
  name: true,
  startDate: true,
  endDate: true,
  closed: true,
  maxTotal: true,
  passPercent: true,
  failBelow: true,
  homeworkCap: true,
  practicalCap: true,
  oralCap: true,
  extraCap: true,
  group: { select: { id: true, name: true } },
  assignments: {
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      category: true,
      title: true,
      dueDate: true,
      maxPoints: true,
    },
  },
} satisfies Prisma.SemesterSelect;

type SemesterRow = Prisma.SemesterGetPayload<{ select: typeof semesterSelect }>;

const historySelect = {
  groupId: true,
  joinedAt: true,
  leftAt: true,
  group: { select: { name: true } },
} satisfies Prisma.GroupMembershipSelect;

type SheetStudent = {
  id: string;
  fullName: string;
  memberships: Prisma.GroupMembershipGetPayload<{
    select: typeof historySelect;
  }>[];
};

export type SemesterInfo = {
  id: string;
  name: string;
  startDate: DateStr;
  endDate: DateStr;
  closed: boolean;
  /** Yopilgan yoki oxirgi kuni o'tgan — EXTRA shundan keyin */
  ended: boolean;
  rules: SemesterRules;
  group: { id: string; name: string };
};

export type AssignmentInfo = {
  id: string;
  category: AssignmentCategory;
  title: string;
  dueDate: DateStr;
  maxPoints: number;
};

export type StudentSemester = {
  id: string;
  fullName: string;
  departure: Departure | null;
  /** assignmentId -> ball va izoh (faqat baholanganlar) */
  grades: Record<string, { points: number; note: string | null }>;
  oral: { date: DateStr; points: number; note: string | null }[];
  adjustments: { id: string; points: number; reason: string }[];
  /**
   * Jarimalar (yangilari birinchi) — sababi bilan, o'quvchiga ham ko'rinadi.
   * auto — avtomatik (uyga vazifaga 0, sababsiz kelmagan): bazada yo'q, o'chirilmaydi
   */
  penalties: {
    id: string;
    points: number;
    name: string;
    note: string | null;
    date: DateStr;
    auto: boolean;
  }[];
  result: SemesterResult;
};

export type SemesterGrades = {
  semester: SemesterInfo;
  assignments: AssignmentInfo[];
  students: StudentSemester[];
};

export function semesterInfo(
  s: Omit<SemesterRow, "assignments">,
  today: DateStr = todayInTashkent(),
): SemesterInfo {
  const endDate = fromDbDate(s.endDate);
  return {
    id: s.id,
    name: s.name,
    startDate: fromDbDate(s.startDate),
    endDate,
    closed: s.closed,
    ended: isSemesterEnded({ endDate, closed: s.closed }, today),
    rules: {
      maxTotal: s.maxTotal,
      passPercent: s.passPercent,
      failBelow: s.failBelow,
      homeworkCap: s.homeworkCap,
      practicalCap: s.practicalCap,
      oralCap: s.oralCap,
      extraCap: s.extraCap,
    },
    group: s.group,
  };
}

const SUM_KEY: Record<AssignmentCategory, keyof PointSums> = {
  HOMEWORK: "homework",
  PRACTICAL: "practical",
  EXTRA: "extra",
  BONUS: "bonus",
};

/** Berilgan o'quvchilar uchun semestr natijalari (o'quvchilarni chaqiruvchi tanlaydi) */
async function buildSemester(
  s: SemesterRow,
  students: readonly SheetStudent[],
): Promise<SemesterGrades> {
  const semester = semesterInfo(s);
  const assignments: AssignmentInfo[] = s.assignments.map((a) => ({
    ...a,
    dueDate: fromDbDate(a.dueDate),
  }));
  const studentIds = students.map((st) => st.id);
  const none = studentIds.length === 0;

  const lessonInSemester = {
    groupId: semester.group.id,
    date: {
      gte: toDbDate(semester.startDate),
      lte: toDbDate(semester.endDate),
    },
  };
  const [grades, oral, adjustments, penalties, absences] = await Promise.all([
    none || assignments.length === 0
      ? []
      : db.assignmentGrade.findMany({
          where: {
            assignmentId: { in: assignments.map((a) => a.id) },
            studentId: { in: studentIds },
          },
          select: {
            assignmentId: true,
            studentId: true,
            points: true,
            note: true,
          },
        }),
    none
      ? []
      : db.oralScore.findMany({
          where: {
            studentId: { in: studentIds },
            lesson: lessonInSemester,
          },
          orderBy: { lesson: { date: "asc" } },
          select: {
            studentId: true,
            points: true,
            note: true,
            lesson: { select: { date: true } },
          },
        }),
    none
      ? []
      : db.pointAdjustment.findMany({
          where: { semesterId: s.id, studentId: { in: studentIds } },
          orderBy: { createdAt: "asc" },
          select: { id: true, studentId: true, points: true, reason: true },
        }),
    none
      ? []
      : db.penalty.findMany({
          where: { semesterId: s.id, studentId: { in: studentIds } },
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            studentId: true,
            points: true,
            note: true,
            date: true,
            type: { select: { name: true } },
          },
        }),
    // Sababsiz kelmaganlar — avtomatik jarima (sababli EXCUSED — jarimasiz)
    none
      ? []
      : db.attendance.findMany({
          where: {
            studentId: { in: studentIds },
            status: "ABSENT",
            lesson: lessonInSemester,
          },
          select: {
            studentId: true,
            lessonId: true,
            lesson: { select: { date: true } },
          },
        }),
  ]);

  const categoryOf = new Map(assignments.map((a) => [a.id, a.category]));
  const assignmentById = new Map(assignments.map((a) => [a.id, a]));

  const rows = students.map((st): StudentSemester => {
    const own = grades.filter((g) => g.studentId === st.id);
    const ownOral = oral.filter((o) => o.studentId === st.id);
    const ownAdj = adjustments.filter((a) => a.studentId === st.id);
    const ownAuto = autoPenalties({
      zeroHomework: own.flatMap((g) => {
        const a = assignmentById.get(g.assignmentId);
        return a && a.category === "HOMEWORK" && g.points === 0
          ? [{ assignmentId: a.id, title: a.title, dueDate: a.dueDate }]
          : [];
      }),
      absences: absences
        .filter((a) => a.studentId === st.id)
        .map((a) => ({
          lessonId: a.lessonId,
          date: fromDbDate(a.lesson.date),
        })),
    });
    const ownPen = [
      ...penalties
        .filter((p) => p.studentId === st.id)
        .map((p) => ({
          id: p.id,
          points: p.points,
          name: p.type.name,
          note: p.note,
          date: fromDbDate(p.date),
          auto: false,
        })),
      ...ownAuto.map((p) => ({ ...p, auto: true })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const sums: PointSums = {
      homework: 0,
      practical: 0,
      oral: ownOral.reduce((sum, o) => sum + o.points, 0),
      extra: 0,
      bonus: 0,
      adjustments: ownAdj.reduce((sum, a) => sum + a.points, 0),
      penalties: ownPen.reduce((sum, p) => sum + p.points, 0),
    };
    for (const g of own) {
      const category = categoryOf.get(g.assignmentId);
      if (category) sums[SUM_KEY[category]] += g.points;
    }

    return {
      id: st.id,
      fullName: st.fullName,
      departure: describeDeparture(
        semester.group.id,
        st.memberships.map((m) => ({
          groupId: m.groupId,
          groupName: m.group.name,
          joinedAt: m.joinedAt,
          leftAt: m.leftAt,
        })),
      ),
      grades: Object.fromEntries(
        own.map((g) => [g.assignmentId, { points: g.points, note: g.note }]),
      ),
      oral: ownOral.map((o) => ({
        date: fromDbDate(o.lesson.date),
        points: o.points,
        note: o.note,
      })),
      adjustments: ownAdj.map(({ id, points, reason }) => ({
        id,
        points,
        reason,
      })),
      penalties: ownPen,
      result: computeSemesterResult(semester.rules, sums, semester.ended),
    };
  });

  // Avval hozirgi a'zolar, keyin ketganlar; alifbo bo'yicha
  rows.sort(
    (a, b) =>
      Number(a.departure !== null) - Number(b.departure !== null) ||
      a.fullName.localeCompare(b.fullName, "uz"),
  );
  return { semester, assignments, students: rows };
}

/** Semestr ichida kamida bir kun guruhda bo'lgan (arxivlanmagan) o'quvchilar */
async function semesterStudents(
  semester: SemesterInfo,
  studentIds?: readonly string[],
): Promise<SheetStudent[]> {
  return db.user.findMany({
    where: {
      role: "STUDENT",
      archivedAt: null,
      ...(studentIds ? { id: { in: [...studentIds] } } : {}),
      memberships: {
        some: membershipOverlapWhere(
          semester.group.id,
          semester.startDate,
          semester.endDate,
        ),
      },
    },
    select: {
      id: true,
      fullName: true,
      memberships: { select: historySelect },
    },
  });
}

/**
 * O'qituvchi uchun: semestrdagi barcha o'quvchilar. studentIds berilsa — faqat ulardan
 * semestrga tegishlilari (ball qo'yishda tekshirish uchun)
 */
export async function getSemesterGrades(
  semesterId: string,
  studentIds?: readonly string[],
): Promise<SemesterGrades | null> {
  const s = await db.semester.findUnique({
    where: { id: semesterId },
    select: semesterSelect,
  });
  if (!s) return null;
  const students = await semesterStudents(semesterInfo(s), studentIds);
  return buildSemester(s, students);
}

/**
 * Bitta o'quvchining semestrlari: u a'zo bo'lgan guruhlarning a'zolik davri bilan kesishgan
 * semestrlar, yangilari birinchi. Natijada faqat shu o'quvchi bo'ladi.
 */
export async function getStudentSemesters(
  studentId: string,
): Promise<SemesterGrades[]> {
  const student = await db.user.findFirst({
    where: { id: studentId, role: "STUDENT" },
    select: {
      id: true,
      fullName: true,
      memberships: { select: historySelect },
    },
  });
  if (!student || student.memberships.length === 0) return [];

  // A'zolik [joinedAt kuni, leftAt kuni) — semestr shu oraliq bilan kesishsa
  const semesters = await db.semester.findMany({
    where: {
      OR: student.memberships.map((m) => ({
        groupId: m.groupId,
        endDate: { gte: toDbDate(todayInTashkent(m.joinedAt)) },
        ...(m.leftAt
          ? { startDate: { lt: toDbDate(todayInTashkent(m.leftAt)) } }
          : {}),
      })),
    },
    orderBy: [{ startDate: "desc" }, { name: "asc" }],
    select: semesterSelect,
  });

  return Promise.all(semesters.map((s) => buildSemester(s, [student])));
}

/** Guruhning bugungi kunni o'z ichiga olgan semestri (bo'lmasa null) */
export async function currentSemesterId(
  groupId: string,
  today: DateStr = todayInTashkent(),
): Promise<string | null> {
  const s = await db.semester.findFirst({
    where: {
      groupId,
      startDate: { lte: toDbDate(today) },
      endDate: { gte: toDbDate(today) },
    },
    orderBy: { startDate: "desc" },
    select: { id: true },
  });
  return s?.id ?? null;
}

export type PointCarryOver = {
  studentId: string;
  /** Yangi guruhning o'tkazish sanasidagi semestri */
  semesterId: string;
  points: number;
  reason: string;
};

/**
 * Guruhga o'tkazishda ballarni ko'chirish (TASKS.md, 7-bosqich): eski guruhning o'tkazish
 * sanasidagi semestridagi jami (jarimalardan keyin) yangi guruh semestriga PointAdjustment
 * bo'lib yoziladi. O'tkazishdan OLDIN chaqiriladi (o'quvchi hali eski guruhda).
 * Yangi guruhda shu sanada semestr bo'lmasa — noTarget, hech narsa ko'chirilmaydi
 */
export async function planPointCarryOver(
  students: readonly { id: string; groupId: string | null }[],
  toGroupId: string,
  date: DateStr,
): Promise<{ items: PointCarryOver[]; noTarget: boolean }> {
  const target = await currentSemesterId(toGroupId, date);
  if (!target) return { items: [], noTarget: true };

  const byGroup = new Map<string, string[]>();
  for (const s of students) {
    if (!s.groupId) continue;
    byGroup.set(s.groupId, [...(byGroup.get(s.groupId) ?? []), s.id]);
  }

  const items: PointCarryOver[] = [];
  for (const [groupId, ids] of byGroup) {
    const source = await currentSemesterId(groupId, date);
    if (!source) continue;
    const data = await getSemesterGrades(source, ids);
    if (!data) continue;
    for (const st of data.students) {
      if (st.result.total <= 0) continue;
      items.push({
        studentId: st.id,
        semesterId: target,
        points: st.result.total,
        reason: `"${data.semester.group.name}" guruhidan ko'chirildi (${data.semester.name})`,
      });
    }
  }
  return { items, noTarget: false };
}
