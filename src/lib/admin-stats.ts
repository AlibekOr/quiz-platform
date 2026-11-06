import "server-only";
import ExcelJS from "exceljs";
import type { Prisma } from "@/generated/prisma/client";
import type { Scope } from "@/lib/auth/scope";
import { computeStats } from "@/lib/attendance";
import { db } from "@/lib/db";
import { currentSemesterId, getSemesterGrades } from "@/lib/grades-data";
import { getMissingHomeworkLessons } from "@/lib/homework-data";
import { getRiskRows } from "@/lib/risk-data";
import { addDays, toDbDate, todayInTashkent } from "@/lib/time";

// ADMIN statistikasi (ROLES.md §6): o'qituvchilar bo'yicha. "O'tayotgan / qo'shimcha /
// yiqilayotgan" — joriy semestrdagi HOZIRGI jami bo'yicha (semestr tugamagan bo'lsa ham)

export const ATTENDANCE_DAYS = 30;

export type TeacherStats = {
  id: string;
  fullName: string;
  regions: string;
  groups: number;
  students: number;
  /** Oxirgi 30 kun davomati, % (dars bo'lmasa null) */
  attendance: number | null;
  passing: number;
  extraChance: number;
  failing: number;
  /** Oxirgi 14 kunda uyga vazifa ham, amaliy ham berilmagan darslar */
  missingHomework: number;
  /** Xavf ostidagi o'quvchilar (ko'rib chiqilmaganlar) */
  atRisk: number;
};

export async function getTeacherStats(filter: {
  regionId: string | null;
  teacherId: string | null;
}): Promise<TeacherStats[]> {
  const today = todayInTashkent();
  const groupWhere: Prisma.GroupWhereInput = filter.regionId
    ? { regionId: filter.regionId }
    : {};
  const teachers = await db.user.findMany({
    where: {
      role: "TEACHER",
      ...(filter.teacherId ? { id: filter.teacherId } : {}),
      ...(filter.regionId
        ? { teacherRegions: { some: { regionId: filter.regionId } } }
        : {}),
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      teacherRegions: { select: { region: { select: { name: true } } } },
      taughtGroups: { where: groupWhere, select: { id: true } },
    },
  });

  return Promise.all(
    teachers.map(async (t): Promise<TeacherStats> => {
      const groupIds = t.taughtGroups.map((g) => g.id);
      const teacherScope: Scope = {
        kind: "limited",
        userId: t.id,
        role: "TEACHER",
        groupIds,
        creatorIds: [t.id],
      };
      const [students, marks, missing, semesters, risk] = await Promise.all([
        db.user.count({
          where: {
            role: "STUDENT",
            archivedAt: null,
            groupId: { in: groupIds },
          },
        }),
        db.attendance.findMany({
          where: {
            lesson: {
              groupId: { in: groupIds },
              date: {
                gte: toDbDate(addDays(today, -(ATTENDANCE_DAYS - 1))),
                lte: toDbDate(today),
              },
            },
          },
          select: { status: true },
        }),
        getMissingHomeworkLessons(teacherScope),
        Promise.all(groupIds.map((g) => currentSemesterId(g, today))),
        getRiskRows(teacherScope, { forManager: false }),
      ]);
      let passing = 0;
      let extraChance = 0;
      let failing = 0;
      for (const semesterId of semesters) {
        if (!semesterId) continue;
        const data = await getSemesterGrades(semesterId);
        for (const s of data?.students ?? []) {
          if (s.departure) continue;
          const r = s.result;
          if (r.total >= r.passScore) passing++;
          else if (r.withoutExtra >= data!.semester.rules.failBelow)
            extraChance++;
          else failing++;
        }
      }
      return {
        id: t.id,
        fullName: t.fullName,
        regions: t.teacherRegions.map((r) => r.region.name).join(", "),
        groups: groupIds.length,
        students,
        attendance: computeStats(marks.map((m) => m.status)).percent,
        passing,
        extraChance,
        failing,
        missingHomework: missing.length,
        atRisk: risk.filter((r) => !r.reviewed).length,
      };
    }),
  );
}

export const STATS_COLUMNS = [
  "O'qituvchi",
  "Regionlar",
  "Guruhlar",
  "O'quvchilar",
  `Davomat ${ATTENDANCE_DAYS} kun, %`,
  "O'tayotgan",
  "Qo'shimcha imkoniyat",
  "Yiqilayotgan",
  "Vazifa berilmagan darslar",
  "Xavf ostida",
] as const;

export function statsRow(s: TeacherStats): (string | number | null)[] {
  return [
    s.fullName,
    s.regions,
    s.groups,
    s.students,
    s.attendance,
    s.passing,
    s.extraChance,
    s.failing,
    s.missingHomework,
    s.atRisk,
  ];
}

export async function buildStatsWorkbook(
  rows: TeacherStats[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Statistika");
  ws.addRow(["№", ...STATS_COLUMNS]).font = { bold: true };
  rows.forEach((r, i) => ws.addRow([i + 1, ...statsRow(r)]));
  ws.columns.forEach((c, i) => (c.width = i === 1 ? 28 : 14));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
