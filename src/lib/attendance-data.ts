import "server-only";
import { db } from "@/lib/db";
import { buildAttendanceReport, type AttendanceMark } from "@/lib/attendance";
import { describeDeparture, toPeriod } from "@/lib/memberships";
import {
  memberOnWhere,
  membershipOverlapWhere,
} from "@/lib/memberships-data";
import { fromDbDate, toDbDate, type DateStr } from "@/lib/time";

// Faqat o'qituvchi sahifalari ishlatadi (ota-ona telefoni bor — CLAUDE.md, 10-qoida)

export type SheetRow = {
  studentId: string;
  fullName: string;
  status: AttendanceMark | null;
  note: string | null;
  parentName: string | null;
  parentPhone: string | null;
  /** O'sha kuni guruh a'zosi bo'lmagan yoki bloklangan, lekin shu darsda yozuvi bor */
  formerMember: boolean;
};

/**
 * Davomat belgilash varag'i. Saqlangan dars bo'lsa — o'sha darsdagi yozuvlar,
 * ustiga o'sha kuni guruh a'zosi bo'lgan faol o'quvchilardan yozuvi yo'qlari qo'shiladi
 * (a'zolik tarixi bo'yicha: keyin o'tkazilganlar ham o'tgan darslarda chiqadi).
 */
export async function getLessonSheet(groupId: string, date: DateStr) {
  const [group, lesson, current] = await Promise.all([
    db.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        schedules: {
          select: { weekday: true, startTime: true, endTime: true },
        },
      },
    }),
    db.lesson.findUnique({
      where: { groupId_date: { groupId, date: toDbDate(date) } },
      select: {
        id: true,
        topic: true,
        attendances: {
          where: { student: { archivedAt: null } },
          select: {
            studentId: true,
            status: true,
            note: true,
            student: {
              select: {
                fullName: true,
                profile: { select: { parentName: true, parentPhone: true } },
              },
            },
          },
        },
      },
    }),
    db.user.findMany({
      where: {
        role: "STUDENT",
        isActive: true,
        archivedAt: null,
        ...memberOnWhere(groupId, date),
      },
      select: {
        id: true,
        fullName: true,
        profile: { select: { parentName: true, parentPhone: true } },
      },
    }),
  ]);
  if (!group) return null;
  const memberIds = new Set(current.map((s) => s.id));

  const rows = new Map<string, SheetRow>();
  for (const a of lesson?.attendances ?? []) {
    rows.set(a.studentId, {
      studentId: a.studentId,
      fullName: a.student.fullName,
      status: a.status,
      note: a.note,
      parentName: a.student.profile?.parentName ?? null,
      parentPhone: a.student.profile?.parentPhone ?? null,
      formerMember: !memberIds.has(a.studentId),
    });
  }
  for (const s of current) {
    if (rows.has(s.id)) continue;
    rows.set(s.id, {
      studentId: s.id,
      fullName: s.fullName,
      status: null,
      note: null,
      parentName: s.profile?.parentName ?? null,
      parentPhone: s.profile?.parentPhone ?? null,
      formerMember: false,
    });
  }

  return {
    group,
    lesson: lesson ? { id: lesson.id, topic: lesson.topic } : null,
    rows: [...rows.values()].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "uz"),
    ),
  };
}

export async function getAttendanceReport(
  groupId: string,
  from: DateStr,
  to: DateStr,
) {
  const [lessons, memberships] = await Promise.all([
    db.lesson.findMany({
      where: { groupId, date: { gte: toDbDate(from), lte: toDbDate(to) } },
      select: {
        date: true,
        attendances: {
          where: { student: { archivedAt: null } },
          select: {
            studentId: true,
            status: true,
            note: true,
            student: { select: { fullName: true } },
          },
        },
      },
    }),
    db.groupMembership.findMany({
      where: {
        ...membershipOverlapWhere(groupId, from, to),
        student: { archivedAt: null },
      },
      select: {
        student: {
          select: {
            id: true,
            fullName: true,
            isActive: true,
            // Guruhdan ketganlik belgisi uchun o'quvchining butun tarixi (bir necha qator)
            memberships: {
              select: {
                groupId: true,
                joinedAt: true,
                leftAt: true,
                group: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const recorded = new Set(
    lessons.flatMap((l) => l.attendances.map((a) => a.studentId)),
  );
  const students = new Map(memberships.map((m) => [m.student.id, m.student]));
  // Bloklangan o'quvchi faqat davomati bo'lsa chiqadi
  const members = [...students.values()]
    .filter((s) => s.isActive || recorded.has(s.id))
    .map((s) => {
      const history = s.memberships.map((m) => ({
        groupId: m.groupId,
        groupName: m.group.name,
        joinedAt: m.joinedAt,
        leftAt: m.leftAt,
      }));
      return {
        id: s.id,
        fullName: s.fullName,
        periods: history.filter((m) => m.groupId === groupId).map(toPeriod),
        departure: describeDeparture(groupId, history),
      };
    });

  return buildAttendanceReport({
    members,
    lessons: lessons.map((l) => ({
      date: fromDbDate(l.date),
      records: l.attendances.map((a) => ({
        studentId: a.studentId,
        studentName: a.student.fullName,
        status: a.status,
        note: a.note,
      })),
    })),
  });
}
