import {
  CATEGORY_SUM_KEY,
  computeSemesterResult,
  EMPTY_SUMS,
  type PointSums,
} from "@/lib/grades";
import type { SemesterGrades, StudentSemester } from "@/lib/grades-data";
import { addDays, weekdayOf, type DateStr } from "@/lib/time";

// O'quvchining semestr bali qanday o'sgani (grafik uchun). Har nuqtadagi jami
// computeSemesterResult bilan hisoblanadi — chegaralar, 60 tavani va jarimalar
// semestr kartasidagi bilan bir xil (CLAUDE.md, 13-qoida)

export type ProgressPoint = { date: DateStr; total: number };

/** Semestr boshidan har hafta oxiri (yakshanba) va oxirgi kun: min(bugun, semestr oxiri) */
function checkpoints(start: DateStr, end: DateStr): DateStr[] {
  const result: DateStr[] = [];
  for (let d = addDays(start, 7 - weekdayOf(start)); d < end; d = addDays(d, 7))
    result.push(d);
  result.push(end);
  return result;
}

export function semesterProgress(
  data: Pick<SemesterGrades, "semester" | "assignments">,
  student: Pick<
    StudentSemester,
    "grades" | "oral" | "penalties" | "adjustments"
  >,
  today: DateStr,
): ProgressPoint[] {
  const { semester } = data;
  if (today < semester.startDate) return [];
  const last = today < semester.endDate ? today : semester.endDate;
  // Sanasi yo'q tuzatishlar boshidan hisoblanadi
  const adjustments = student.adjustments.reduce((s, a) => s + a.points, 0);

  return checkpoints(semester.startDate, last).map((date) => {
    const sums: PointSums = { ...EMPTY_SUMS, adjustments };
    for (const a of data.assignments) {
      const grade = student.grades[a.id];
      if (grade && a.dueDate <= date)
        sums[CATEGORY_SUM_KEY[a.category]] += grade.points;
    }
    for (const o of student.oral) if (o.date <= date) sums.oral += o.points;
    for (const p of student.penalties)
      if (p.date <= date) sums.penalties += p.points;
    const { total } = computeSemesterResult(
      semester.rules,
      sums,
      semester.ended,
    );
    return { date, total };
  });
}
