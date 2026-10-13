import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { computeSemesterResult, DEFAULT_RULES, EMPTY_SUMS } from "./grades";
import type { SemesterGrades } from "./grades-data";
import { buildGradesWorkbook, GRADES_HEADER_ROW } from "./grades-excel";

function student(
  id: string,
  fullName: string,
  homework: number,
): SemesterGrades["students"][number] {
  return {
    id,
    fullName,
    departure: null,
    grades: { hw: { points: homework, note: null } },
    oral: [{ date: "2026-10-05", points: 1, note: null }],
    adjustments: [],
    penalties: [],
    result: computeSemesterResult(
      DEFAULT_RULES,
      { ...EMPTY_SUMS, homework, oral: 1 },
      false,
    ),
  };
}

const data: SemesterGrades = {
  semester: {
    id: "s1",
    name: "1-semestr",
    startDate: "2026-10-01",
    endDate: "2026-12-31",
    closed: false,
    ended: false,
    rules: DEFAULT_RULES,
    group: { id: "g1", name: "Frontend-1" },
  },
  assignments: [
    {
      id: "hw",
      category: "HOMEWORK",
      title: "UV",
      dueDate: "2026-10-02",
      maxPoints: 1,
    },
  ],
  students: [student("a", "Anvar", 1), student("b", "Bobur", 0.5)],
};

describe("buildGradesWorkbook", () => {
  it("har varaqda № ustuni, ism va ma'lumotlar bir ustun o'ngga", async () => {
    const buffer = await buildGradesWorkbook(data);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const values = (sheet: ExcelJS.Worksheet, r: number) =>
      (sheet.getRow(r).values as unknown[]).slice(1);

    const [summary, homework, oral] = workbook.worksheets;
    expect(workbook.worksheets.map((w) => w.name)).toEqual([
      "Jami",
      "Uyga vazifa",
      "Og'zaki",
    ]);

    const head = values(summary, GRADES_HEADER_ROW);
    expect(head.slice(0, 3)).toEqual(["№", "O'quvchi", "Uy vazifa / 30"]);
    expect(head.at(-1)).toBe("Holat");
    const anvar = values(summary, GRADES_HEADER_ROW + 1);
    expect(anvar.slice(0, 3)).toEqual([1, "Anvar", 1]);
    // Jami ustuni: Holat'dan oldingi
    expect(anvar[head.length - 2]).toBe(2);
    expect(values(summary, GRADES_HEADER_ROW + 2).slice(0, 2)).toEqual([
      2,
      "Bobur",
    ]);
    expect(summary.views[0]).toMatchObject({ xSplit: 2 });

    expect(values(homework, GRADES_HEADER_ROW)).toEqual([
      "№",
      "O'quvchi",
      "UV (02.10) / 1",
      "Jami",
    ]);
    expect(values(homework, GRADES_HEADER_ROW + 2)).toEqual([
      2,
      "Bobur",
      0.5,
      0.5,
    ]);

    expect(values(oral, GRADES_HEADER_ROW)).toEqual([
      "№",
      "O'quvchi",
      "05.10",
      "Jami",
    ]);
    expect(values(oral, GRADES_HEADER_ROW + 1)).toEqual([1, "Anvar", 1, 1]);
  });
});
