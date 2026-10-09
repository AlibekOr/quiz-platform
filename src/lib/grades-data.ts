import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { db } from "@/lib/db";
import {
  buildGradeSheet,
  itemKey,
  type GradeItem,
  type GradeSheet,
  type StudentGradeInput,
} from "@/lib/grades";
import { describeDeparture } from "@/lib/memberships";
import { membershipOverlapWhere } from "@/lib/memberships-data";
import {
  fromDbDate,
  toDbDate,
  todayInTashkent,
  type DateStr,
} from "@/lib/time";

// Baholar varag'i uchun ma'lumot yig'ish. O'quvchi uchun chaqirilganda varaqda faqat
// o'zi bo'ladi (boshqalarning ballari yuborilmaydi); aloqa ma'lumotlari umuman olinmaydi

const periodSelect = {
  id: true,
  name: true,
  startDate: true,
  endDate: true,
  passPercent: true,
  group: { select: { id: true, name: true } },
  homeworks: {
    select: { id: true, title: true, dueDate: true, maxPoints: true },
  },
  tests: {
    select: {
      points: true,
      test: { select: { id: true, title: true, dueDate: true } },
    },
  },
} satisfies Prisma.PeriodSelect;

type PeriodRow = Prisma.PeriodGetPayload<{ select: typeof periodSelect }>;

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

export type PeriodInfo = {
  id: string;
  name: string;
  startDate: DateStr;
  endDate: DateStr;
  passPercent: number;
  group: { id: string; name: string };
};

export type PeriodGrades = { period: PeriodInfo; sheet: GradeSheet };

function periodItems(p: PeriodRow): GradeItem[] {
  return [
    ...p.homeworks.map((h): GradeItem => ({
      type: "HOMEWORK",
      id: h.id,
      title: h.title,
      maxPoints: h.maxPoints,
      dueDate: fromDbDate(h.dueDate),
    })),
    ...p.tests.map((t): GradeItem => ({
      type: "TEST",
      id: t.test.id,
      title: t.test.title,
      maxPoints: t.points,
      dueDate: t.test.dueDate ? fromDbDate(t.test.dueDate) : null,
    })),
  ];
}

function periodInfo(p: PeriodRow): PeriodInfo {
  return {
    id: p.id,
    name: p.name,
    startDate: fromDbDate(p.startDate),
    endDate: fromDbDate(p.endDate),
    passPercent: p.passPercent,
    group: p.group,
  };
}

/** Berilgan o'quvchilar uchun davr varag'i (o'quvchilarni chaqiruvchi tanlaydi) */
async function buildSheet(
  p: PeriodRow,
  students: readonly SheetStudent[],
): Promise<GradeSheet> {
  const studentIds = students.map((s) => s.id);
  const homeworkIds = p.homeworks.map((h) => h.id);
  const testIds = p.tests.map((t) => t.test.id);
  const none = studentIds.length === 0;

  const [grades, attempts, exemptions, adjustments] = await Promise.all([
    none || homeworkIds.length === 0
      ? []
      : db.homeworkGrade.findMany({
          where: {
            homeworkId: { in: homeworkIds },
            studentId: { in: studentIds },
          },
          select: {
            homeworkId: true,
            studentId: true,
            points: true,
            note: true,
          },
        }),
    none || testIds.length === 0
      ? []
      : db.attempt.findMany({
          where: {
            testId: { in: testIds },
            userId: { in: studentIds },
            isFirst: true,
            status: { in: ["FINISHED", "EXPIRED"] },
          },
          select: { testId: true, userId: true, score: true, maxScore: true },
        }),
    none
      ? []
      : db.gradeExemption.findMany({
          where: {
            studentId: { in: studentIds },
            OR: [
              { itemType: "HOMEWORK", itemId: { in: homeworkIds } },
              { itemType: "TEST", itemId: { in: testIds } },
            ],
          },
          select: {
            studentId: true,
            itemType: true,
            itemId: true,
            reason: true,
          },
        }),
    none
      ? []
      : db.pointAdjustment.findMany({
          where: { periodId: p.id, studentId: { in: studentIds } },
          orderBy: { createdAt: "asc" },
          select: { studentId: true, points: true, reason: true },
        }),
  ]);

  const inputs: StudentGradeInput[] = students.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    departure: describeDeparture(
      p.group.id,
      s.memberships.map((m) => ({
        groupId: m.groupId,
        groupName: m.group.name,
        joinedAt: m.joinedAt,
        leftAt: m.leftAt,
      })),
    ),
    homework: new Map(
      grades
        .filter((g) => g.studentId === s.id)
        .map((g) => [g.homeworkId, { points: g.points, note: g.note }]),
    ),
    tests: new Map(
      attempts
        .filter((a) => a.userId === s.id)
        .map((a) => [
          a.testId,
          { score: a.score ?? 0, maxScore: a.maxScore ?? 0 },
        ]),
    ),
    exemptions: new Map(
      exemptions
        .filter((e) => e.studentId === s.id)
        .map((e) => [itemKey({ type: e.itemType, id: e.itemId }), e.reason]),
    ),
    adjustments: adjustments
      .filter((a) => a.studentId === s.id)
      .map((a) => ({ points: a.points, reason: a.reason })),
  }));

  return buildGradeSheet({
    items: periodItems(p),
    students: inputs,
    passPercent: p.passPercent,
    today: todayInTashkent(),
  });
}

/** O'qituvchi uchun: davr ichida kamida bir kun guruhda bo'lgan barcha o'quvchilar */
export async function getPeriodGrades(
  periodId: string,
): Promise<PeriodGrades | null> {
  const p = await db.period.findUnique({
    where: { id: periodId },
    select: periodSelect,
  });
  if (!p) return null;
  for (const t of p.tests) await finalizeExpiredAttempts({ testId: t.test.id });

  const info = periodInfo(p);
  const students = await db.user.findMany({
    where: {
      role: "STUDENT",
      archivedAt: null,
      memberships: {
        some: membershipOverlapWhere(
          info.group.id,
          info.startDate,
          info.endDate,
        ),
      },
    },
    select: {
      id: true,
      fullName: true,
      memberships: { select: historySelect },
    },
  });
  return { period: info, sheet: await buildSheet(p, students) };
}

/**
 * Bitta o'quvchining baholari: u a'zo bo'lgan guruhlarning a'zolik davri bilan kesishgan
 * davrlari, yangilari birinchi. Varaqda faqat shu o'quvchi bo'ladi.
 */
export async function getStudentGrades(
  studentId: string,
): Promise<PeriodGrades[]> {
  const student = await db.user.findFirst({
    where: { id: studentId, role: "STUDENT" },
    select: {
      id: true,
      fullName: true,
      memberships: { select: historySelect },
    },
  });
  if (!student || student.memberships.length === 0) return [];
  await finalizeExpiredAttempts({ userId: student.id });

  // A'zolik [joinedAt kuni, leftAt kuni) — davr shu oraliq bilan kesishsa
  const periods = await db.period.findMany({
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
    select: periodSelect,
  });

  return Promise.all(
    periods.map(async (p) => ({
      period: periodInfo(p),
      sheet: await buildSheet(p, [student]),
    })),
  );
}

/**
 * O'tkazishda: yangi guruhning muddati o'tkazish kunidan oldin tugagan vazifa va testlaridan
 * ozod qilish. O'quvchi allaqachon ishlagan test ozod qilinmaydi (bali saqlanadi).
 * Doim o'tkazish tranzaksiyasi ichida chaqiriladi.
 */
export async function exemptBeforeTransfer(
  tx: Prisma.TransactionClient,
  input: {
    studentIds: string[];
    groupId: string;
    date: DateStr;
    reason: string;
    createdById: string;
  },
): Promise<number> {
  const { studentIds, groupId, date, reason, createdById } = input;
  const before = { lt: toDbDate(date) };
  const [homeworks, tests] = await Promise.all([
    tx.homework.findMany({
      where: { period: { groupId }, dueDate: before },
      select: { id: true },
    }),
    tx.test.findMany({
      where: { periods: { some: { period: { groupId } } }, dueDate: before },
      select: {
        id: true,
        attempts: {
          where: {
            userId: { in: studentIds },
            isFirst: true,
            status: { in: ["FINISHED", "EXPIRED"] },
          },
          select: { userId: true },
        },
      },
    }),
  ]);

  const data = studentIds.flatMap((studentId) => [
    ...homeworks.map((h) => ({
      studentId,
      itemType: "HOMEWORK" as const,
      itemId: h.id,
      reason,
      createdById,
    })),
    ...tests
      .filter((t) => !t.attempts.some((a) => a.userId === studentId))
      .map((t) => ({
        studentId,
        itemType: "TEST" as const,
        itemId: t.id,
        reason,
        createdById,
      })),
  ]);
  if (data.length === 0) return 0;
  const { count } = await tx.gradeExemption.createMany({
    data,
    skipDuplicates: true,
  });
  return count;
}
