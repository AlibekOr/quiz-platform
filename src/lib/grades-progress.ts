import { computeSemesterResult } from "@/lib/grades";
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
    const byCategory: Record<string, number> = {};
    for (const a of data.assignments) {
      const grade = student.grades[a.id];
      if (grade && a.dueDate <= date)
        byCategory[a.categoryId] = (byCategory[a.categoryId] ?? 0) + grade.points;
    }
    const oral = semester.rules.categories.find((c) => c.kind === "ORAL");
    if (oral)
      byCategory[oral.id] = student.oral
        .filter((o) => o.date <= date)
        .reduce((s, o) => s + o.points, 0);
    const penalties = student.penalties
      .filter((p) => p.date <= date)
      .reduce((s, p) => s + p.points, 0);
    const { total } = computeSemesterResult(
      semester.rules,
      { byCategory, adjustments, penalties },
      semester.ended,
    );
    return { date, total };
  });
}
