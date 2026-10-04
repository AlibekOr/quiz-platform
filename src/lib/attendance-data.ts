import "server-only";
import { db } from "@/lib/db";
import { buildAttendanceReport, type AttendanceMark } from "@/lib/attendance";
import { fromDbDate, toDbDate, type DateStr } from "@/lib/time";

// Faqat o'qituvchi sahifalari ishlatadi (ota-ona telefoni bor — CLAUDE.md, 10-qoida)

export type SheetRow = {
  studentId: string;
  fullName: string;
  status: AttendanceMark | null;
  note: string | null;
  parentName: string | null;
  parentPhone: string | null;
  /** Hozir boshqa guruhda yoki bloklangan, lekin shu darsda yozuvi bor */
  formerMember: boolean;
};

/**
 * Davomat belgilash varag'i. Saqlangan dars bo'lsa — o'sha darsdagi yozuvlar,
 * ustiga guruhning hozirgi faol o'quvchilaridan yozuvi yo'qlari qo'shiladi.
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
          select: {
            studentId: true,
            status: true,
            note: true,
            student: {
              select: {
                fullName: true,
                groupId: true,
                isActive: true,
                profile: { select: { parentName: true, parentPhone: true } },
              },
            },
          },
        },
      },
    }),
    db.user.findMany({
      where: { role: "STUDENT", isActive: true, groupId },
      select: {
        id: true,
        fullName: true,
        profile: { select: { parentName: true, parentPhone: true } },
      },
    }),
  ]);
  if (!group) return null;

  const rows = new Map<string, SheetRow>();
  for (const a of lesson?.attendances ?? []) {
    rows.set(a.studentId, {
      studentId: a.studentId,
      fullName: a.student.fullName,
      status: a.status,
      note: a.note,
      parentName: a.student.profile?.parentName ?? null,
      parentPhone: a.student.profile?.parentPhone ?? null,
      formerMember: a.student.groupId !== groupId || !a.student.isActive,
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
  const [lessons, current] = await Promise.all([
    db.lesson.findMany({
      where: { groupId, date: { gte: toDbDate(from), lte: toDbDate(to) } },
      select: {
        date: true,
        attendances: {
          select: {
            studentId: true,
            status: true,
            note: true,
            student: { select: { fullName: true } },
          },
        },
      },
    }),
    db.user.findMany({
      where: { role: "STUDENT", isActive: true, groupId },
      select: { id: true, fullName: true },
    }),
  ]);

  return buildAttendanceReport({
    currentStudents: current,
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
