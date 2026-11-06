import "server-only";
import { unstable_cache } from "next/cache";
import type { AttendanceMark } from "@/lib/attendance";
import { groupScopeWhere, type Scope } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { currentSemesterId, getSemesterGrades } from "@/lib/grades-data";
import { groupLabel } from "@/lib/group-label";
import {
  compareRisk,
  computeRisk,
  DEFAULT_RISK_SETTINGS,
  forManager,
  isReviewActive,
  type RiskResult,
  type RiskSettings,
  type RiskSignalKind,
} from "@/lib/risk";
import {
  fromDbDate,
  todayInTashkent,
  toDbDate,
  type DateStr,
} from "@/lib/time";

// Xavf ostidagi o'quvchilar (FEATURES.md, A qism): ma'lumot yig'ish. Qoidalar — lib/risk.ts.
// Har guruh uchun bir nechta so'rov (N+1 yo'q), natija 5 daqiqa keshlanadi.
// Menejerga ball signallari hech qachon qaytmaydi (forManager)

export type RiskRow = {
  studentId: string;
  fullName: string;
  groupId: string;
  groupName: string;
  parentPhone: string | null;
  risk: RiskResult;
  /** Amaldagi "Ko'rib chiqildi" (hideUntil o'tmagan va yangi signal yo'q) */
  reviewed: { note: string | null; hideUntil: DateStr } | null;
};

export async function getRiskSettings(
  teacherId: string,
): Promise<RiskSettings> {
  const s = await db.riskSettings.findUnique({ where: { teacherId } });
  if (!s) return DEFAULT_RISK_SETTINGS;
  return {
    consecutiveAbsences: { enabled: s.absencesEnabled, min: s.absencesMin },
    lowAttendance: {
      enabled: s.attendanceEnabled,
      belowPercent: s.attendanceBelow,
      minLessons: s.attendanceMinLessons,
    },
    missedAssignments: {
      enabled: s.missedEnabled,
      lastN: s.missedLastN,
      minMissed: s.missedMin,
    },
    scorePace: {
      enabled: s.paceEnabled,
      ratio: s.paceRatio,
      graceDays: s.paceGraceDays,
      highAfter: s.paceHighAfter,
    },
    penalties: {
      enabled: s.penaltiesEnabled,
      windowDays: s.penaltiesWindowDays,
      minPoints: s.penaltiesMin,
    },
  };
}

type GroupRisk = { studentId: string; fullName: string; risk: RiskResult }[];

/** Bitta guruh (joriy semestri bo'yicha); semestri yo'q yoki yopilgan — bo'sh */
async function computeGroupRisk(
  groupId: string,
  teacherId: string,
  today: DateStr,
): Promise<GroupRisk> {
  const semesterId = await currentSemesterId(groupId, today);
  if (!semesterId) return [];
  const [data, settings] = await Promise.all([
    getSemesterGrades(semesterId),
    getRiskSettings(teacherId),
  ]);
  if (!data || data.semester.closed) return [];
  const current = data.students.filter((s) => s.departure === null);
  if (current.length === 0) return [];
  const { startDate, endDate } = data.semester;

  const [lessons, memberships] = await Promise.all([
    db.lesson.findMany({
      where: {
        groupId,
        date: { gte: toDbDate(startDate), lte: toDbDate(today) },
      },
      select: {
        date: true,
        attendances: { select: { studentId: true, status: true } },
      },
    }),
    db.groupMembership.findMany({
      where: { groupId, studentId: { in: current.map((s) => s.id) } },
      select: { studentId: true, joinedAt: true, leftAt: true },
    }),
  ]);
  // Uyga vazifa va amaliy (darsga beriladigan) — "topshirilmagan" signali uchun
  const tasks = data.assignments.filter(
    (a) => a.category === "HOMEWORK" || a.category === "PRACTICAL",
  );

  return current.map((s) => {
    // Faqat o'quvchi guruhda bo'lgan darslar (a'zolik [joinedAt kuni, leftAt kuni))
    const periods = memberships
      .filter((m) => m.studentId === s.id)
      .map((m) => ({
        from: todayInTashkent(m.joinedAt),
        to: m.leftAt ? todayInTashkent(m.leftAt) : null,
      }));
    const member = (date: DateStr) =>
      periods.some((p) => date >= p.from && (p.to === null || date < p.to));
    const own = lessons.flatMap((l) => {
      const date = fromDbDate(l.date);
      if (!member(date)) return [];
      const mark = l.attendances.find((a) => a.studentId === s.id)?.status;
      return [{ date, mark: (mark ?? null) as AttendanceMark | null }];
    });
    const risk = computeRisk(
      {
        today,
        semester: { startDate, endDate },
        lessons: own,
        assignments: tasks
          .filter((a) => member(a.dueDate))
          .map((a) => ({
            dueDate: a.dueDate,
            points: s.grades[a.id]?.points ?? null,
          })),
        total: s.result.total,
        passScore: s.result.passScore,
        penalties: s.penalties.map((p) => ({ date: p.date, points: p.points })),
      },
      settings,
    );
    return { studentId: s.id, fullName: s.fullName, risk };
  });
}

/** Ma'lumot o'zgarsa ham ko'pi bilan 5 daqiqa eski bo'ladi (FEATURES.md, "Texnik") */
const cachedGroupRisk = unstable_cache(computeGroupRisk, ["group-risk"], {
  revalidate: 300,
});

/**
 * Doiradagi xavf ostidagi o'quvchilar (daraja bor bo'lganlar), tartiblangan.
 * Menejer uchun — faqat davomat va vazifa signallari
 */
export async function getRiskRows(
  scope: Scope,
  options: { forManager: boolean; groupId?: string | null } = {
    forManager: false,
  },
): Promise<RiskRow[]> {
  const today = todayInTashkent();
  const groups = await db.group.findMany({
    where: {
      ...groupScopeWhere(scope),
      ...(options.groupId ? { id: options.groupId } : {}),
    },
    select: { id: true, name: true, code: true, teacherId: true },
  });
  const perGroup = await Promise.all(
    groups.map(async (g) => {
      const rows = await cachedGroupRisk(g.id, g.teacherId, today);
      return rows.map((r) => ({
        ...r,
        groupId: g.id,
        groupName: groupLabel(g),
        risk: options.forManager ? forManager(r.risk) : r.risk,
      }));
    }),
  );
  const atRisk = perGroup.flat().filter((r) => r.risk.level !== null);
  const ids = atRisk.map((r) => r.studentId);
  const [profiles, reviews] = await Promise.all([
    db.studentProfile.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, parentPhone: true },
    }),
    db.riskReview.findMany({
      where: { studentId: { in: ids }, hideUntil: { gt: toDbDate(today) } },
      orderBy: { createdAt: "desc" },
      select: {
        studentId: true,
        note: true,
        signalKinds: true,
        hideUntil: true,
      },
    }),
  ]);
  const rows: RiskRow[] = atRisk.map((r) => {
    const review = reviews.find((v) => v.studentId === r.studentId);
    const active =
      review !== undefined &&
      isReviewActive(
        {
          hideUntil: fromDbDate(review.hideUntil),
          signalKinds: review.signalKinds as RiskSignalKind[],
        },
        r.risk.signals,
        today,
      );
    return {
      ...r,
      parentPhone:
        profiles.find((p) => p.userId === r.studentId)?.parentPhone ?? null,
      reviewed:
        active && review
          ? { note: review.note, hideUntil: fromDbDate(review.hideUntil) }
          : null,
    };
  });
  return rows.sort((a, b) =>
    compareRisk(
      { ...a, reviewed: a.reviewed !== null },
      { ...b, reviewed: b.reviewed !== null },
    ),
  );
}

export type RiskReviewEntry = {
  id: string;
  createdAt: Date;
  note: string | null;
  reviewer: string;
  signalKinds: RiskSignalKind[];
  hideUntil: DateStr;
};

/** O'quvchi kartochkasi: joriy signallar va "Ko'rib chiqildi" tarixi (doirani chaqiruvchi tekshiradi) */
export async function getStudentRisk(
  scope: Scope,
  student: { id: string; groupId: string | null },
): Promise<{ row: RiskRow | null; history: RiskReviewEntry[] }> {
  const [rows, history] = await Promise.all([
    student.groupId
      ? getRiskRows(scope, { forManager: false, groupId: student.groupId })
      : Promise.resolve([]),
    db.riskReview.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        note: true,
        signalKinds: true,
        hideUntil: true,
        reviewedBy: { select: { fullName: true } },
      },
    }),
  ]);
  return {
    row: rows.find((r) => r.studentId === student.id) ?? null,
    history: history.map((h) => ({
      id: h.id,
      createdAt: h.createdAt,
      note: h.note,
      reviewer: h.reviewedBy.fullName,
      signalKinds: h.signalKinds as RiskSignalKind[],
      hideUntil: fromDbDate(h.hideUntil),
    })),
  };
}
