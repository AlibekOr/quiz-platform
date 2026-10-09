import "server-only";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import {
  canAccessGroup,
  studentScopeWhere,
  type Scope,
} from "@/lib/auth/scope";
import { db } from "@/lib/db";
import {
  buildStudentRows,
  computeQuestionStats,
  type QuestionStat,
  type ResultStudent,
  type StudentResultRow,
} from "@/lib/results";

export type TestResults = {
  test: { id: string; title: string; questionCount: number };
  rows: StudentResultRow[];
  questionStats: QuestionStat[];
  /** Statistikaga kirgan birinchi urinishlar soni */
  firstAttemptCount: number;
};

/**
 * Test natijalari (o'qituvchi yoki menejer; chaqiruvchi testga ruxsatni tekshiradi).
 * Menejer uchun faqat doiradagi o'quvchilar: qatorlar ham, savollar statistikasi ham.
 * Qatorlar: urinishi bor o'quvchilar + testga biriktirilgan guruhlardagi hali ishlamagan faol o'quvchilar.
 * Guruh filtri o'quvchining hozirgi guruhi bo'yicha. Savollar statistikasi faqat birinchi urinishlar bo'yicha
 * (qayta ishlashlar foizni sun'iy oshirmasligi uchun).
 */
export async function getTestResults(
  testId: string,
  groupId: string | null,
  scope: Scope,
): Promise<TestResults | null> {
  await finalizeExpiredAttempts({ testId });

  const test = await db.test.findUnique({
    where: { id: testId },
    select: {
      id: true,
      title: true,
      groups: { select: { id: true } },
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          text: true,
          type: true,
          points: true,
          options: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, isCorrect: true },
          },
        },
      },
    },
  });
  if (!test) return null;

  const studentSelect = {
    id: true,
    fullName: true,
    isActive: true,
    group: { select: { name: true } },
  } as const;
  const groupWhere = groupId ? { groupId } : {};
  const assignedGroupIds = test.groups
    .map((g) => g.id)
    .filter((id) => !groupId || id === groupId)
    .filter((id) => canAccessGroup(scope, id));

  const [attempts, idle] = await Promise.all([
    db.attempt.findMany({
      where: {
        testId,
        user: {
          role: "STUDENT",
          archivedAt: null,
          ...groupWhere,
          ...studentScopeWhere(scope),
        },
      },
      orderBy: { startedAt: "asc" },
      select: {
        id: true,
        userId: true,
        status: true,
        isFirst: true,
        score: true,
        maxScore: true,
        durationSec: true,
        startedAt: true,
        user: { select: studentSelect },
      },
    }),
    db.user.findMany({
      where: {
        role: "STUDENT",
        isActive: true,
        archivedAt: null,
        groupId: { in: assignedGroupIds },
        attempts: { none: { testId } },
      },
      select: studentSelect,
    }),
  ]);

  const students = new Map<string, ResultStudent>();
  for (const u of [...attempts.map((a) => a.user), ...idle]) {
    students.set(u.id, {
      id: u.id,
      fullName: u.fullName,
      groupName: u.group?.name ?? null,
      isActive: u.isActive,
    });
  }
  const rows = buildStudentRows([...students.values()], attempts);

  const firstIds = attempts
    .filter((a) => a.isFirst && a.status !== "IN_PROGRESS")
    .map((a) => a.id);
  const answers = firstIds.length
    ? await db.answer.findMany({
        where: { attemptId: { in: firstIds } },
        select: { questionId: true, selectedOptionIds: true, isCorrect: true },
      })
    : [];

  return {
    test: {
      id: test.id,
      title: test.title,
      questionCount: test.questions.length,
    },
    rows,
    questionStats: computeQuestionStats(
      test.questions,
      answers,
      firstIds.length,
    ),
    firstAttemptCount: firstIds.length,
  };
}
