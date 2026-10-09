import { describe, expect, it } from "vitest";
import {
  buildGradeSheet,
  computeStudentGrades,
  formatPoints,
  itemKey,
  testPoints,
  type GradeItem,
  type StudentGradeInput,
} from "./grades";

const TODAY = "2026-10-20";

const hw = (
  id: string,
  maxPoints: number,
  dueDate: string | null,
): GradeItem => ({
  type: "HOMEWORK",
  id,
  title: id,
  maxPoints,
  dueDate,
});
const test = (
  id: string,
  maxPoints: number,
  dueDate: string | null,
): GradeItem => ({
  type: "TEST",
  id,
  title: id,
  maxPoints,
  dueDate,
});

function student(over: Partial<StudentGradeInput> = {}): StudentGradeInput {
  return {
    id: "s1",
    fullName: "Ali",
    departure: null,
    homework: new Map(),
    tests: new Map(),
    exemptions: new Map(),
    adjustments: [],
    ...over,
  };
}

describe("testPoints", () => {
  it("foiz × davr bali, 0.1 gacha", () => {
    expect(testPoints(8, 10, 20)).toBe(16);
    expect(testPoints(2, 3, 10)).toBe(6.7);
    expect(testPoints(0, 0, 10)).toBe(0);
  });
});

describe("computeStudentGrades", () => {
  const items = [hw("h1", 10, "2026-10-10"), test("t1", 20, "2026-10-15")];

  it("baholangan va muddati o'tgan itemlar hisobga kiradi; foiz va chegara", () => {
    const g = computeStudentGrades(
      items,
      student({
        homework: new Map([["h1", { points: 8, note: null }]]),
        tests: new Map([["t1", { score: 7, maxScore: 10 }]]),
      }),
      60,
      TODAY,
    );
    expect(g.earned).toBe(22);
    expect(g.max).toBe(30);
    expect(g.total).toBe(22);
    expect(g.percent).toBe(73);
    expect(g.passed).toBe(true);
  });

  it("muddati o'tib baholanmagan = 0, muddati o'tmagani hisobga kirmaydi", () => {
    const g = computeStudentGrades(
      [...items, hw("h2", 10, "2026-10-25"), hw("h3", 5, null)],
      student({ homework: new Map([["h1", { points: 10, note: null }]]) }),
      60,
      TODAY,
    );
    expect(g.cells[1]).toEqual({
      kind: "points",
      points: 0,
      note: null,
      missing: true,
    });
    expect(g.cells[2]).toEqual({ kind: "pending" });
    expect(g.cells[3]).toEqual({ kind: "pending" });
    expect(g.max).toBe(30);
    expect(g.percent).toBe(33);
    expect(g.passed).toBe(false);
  });

  it("muddat kuni o'zida hali hisobga kirmaydi", () => {
    const g = computeStudentGrades([hw("h1", 10, TODAY)], student(), 60, TODAY);
    expect(g.cells[0]).toEqual({ kind: "pending" });
    expect(g.max).toBe(0);
    expect(g.percent).toBeNull();
    expect(g.passed).toBeNull();
  });

  it("ozod qilish maksimal ball va chegarani qayta hisoblaydi", () => {
    const base = student({
      homework: new Map([["h1", { points: 9, note: null }]]),
    });
    const before = computeStudentGrades(items, base, 60, TODAY);
    expect(before.max).toBe(30);
    expect(before.passed).toBe(false);

    const after = computeStudentGrades(
      items,
      { ...base, exemptions: new Map([[itemKey(items[1]), "O'tkazilgan"]]) },
      60,
      TODAY,
    );
    expect(after.cells[1]).toEqual({ kind: "exempt", reason: "O'tkazilgan" });
    expect(after.max).toBe(10);
    expect(after.total).toBe(9);
    expect(after.percent).toBe(90);
    expect(after.passed).toBe(true);
  });

  it("manfiy tuzatish jamidan ayiriladi, 0 dan pastga tushmaydi", () => {
    const s = student({
      homework: new Map([["h1", { points: 6, note: null }]]),
      tests: new Map([["t1", { score: 5, maxScore: 10 }]]),
    });
    const g = computeStudentGrades(
      items,
      { ...s, adjustments: [{ points: -4, reason: "Intizom" }] },
      60,
      TODAY,
    );
    expect(g.earned).toBe(16);
    expect(g.adjustment).toBe(-4);
    expect(g.total).toBe(12);

    const zero = computeStudentGrades(
      items,
      { ...s, adjustments: [{ points: -100, reason: "x" }] },
      60,
      TODAY,
    );
    expect(zero.total).toBe(0);
  });

  it("jami maksimaldan oshmaydi (musbat tuzatish va ortiqcha ball bilan ham)", () => {
    const g = computeStudentGrades(
      items,
      student({
        homework: new Map([["h1", { points: 15, note: null }]]),
        tests: new Map([["t1", { score: 10, maxScore: 10 }]]),
        adjustments: [{ points: 5, reason: "Olimpiada" }],
      }),
      60,
      TODAY,
    );
    expect(g.cells[0]).toMatchObject({ points: 10 });
    expect(g.total).toBe(30);
    expect(g.percent).toBe(100);
  });
});

describe("buildGradeSheet", () => {
  it("itemlar muddat bo'yicha, ketganlar oxirida", () => {
    const sheet = buildGradeSheet({
      items: [
        hw("b", 5, null),
        hw("a", 5, "2026-10-12"),
        test("c", 5, "2026-10-01"),
      ],
      students: [
        student({
          id: "x",
          fullName: "Bobur",
          departure: { kind: "removed", date: "2026-10-05" },
        }),
        student({ id: "y", fullName: "Zafar" }),
        student({ id: "z", fullName: "Anvar" }),
      ],
      passPercent: 60,
      today: TODAY,
    });
    expect(sheet.items.map((i) => i.id)).toEqual(["c", "a", "b"]);
    expect(sheet.students.map((s) => s.fullName)).toEqual([
      "Anvar",
      "Zafar",
      "Bobur",
    ]);
  });
});

describe("formatPoints", () => {
  it("vergul bilan", () => {
    expect(formatPoints(12)).toBe("12");
    expect(formatPoints(6.67)).toBe("6,7");
  });
});

describe("buildGradesWorkbook", () => {
  it('ozod katak "—" va izoh bilan, tuzatish alohida ustunda, foiz va holat', async () => {
    const { default: ExcelJS } = await import("exceljs");
    const { buildGradesWorkbook, GRADES_HEADER_ROW } =
      await import("./grades-excel");
    const items = [hw("h1", 10, "2026-10-10"), test("t1", 20, "2026-10-15")];
    const sheet = buildGradeSheet({
      items,
      students: [
        student({
          homework: new Map([["h1", { points: 9, note: null }]]),
          exemptions: new Map([[itemKey(items[1]), "O'tkazilgan"]]),
          adjustments: [{ points: -1, reason: "Kechikish" }],
        }),
      ],
      passPercent: 60,
      today: TODAY,
    });
    const buffer = await buildGradesWorkbook(sheet, {
      groupName: "Frontend-1",
      periodName: "Oktyabr",
      from: "2026-10-01",
      to: "2026-10-31",
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const ws = workbook.worksheets[0];
    const header = (ws.getRow(GRADES_HEADER_ROW).values as unknown[]).slice(1);
    expect(header.slice(3)).toEqual([
      "Tuzatish",
      "Jami",
      "Maks.",
      "Foiz",
      "Holat",
    ]);
    const row = ws.getRow(GRADES_HEADER_ROW + 1);
    expect((row.values as unknown[]).slice(1)).toEqual([
      "Ali",
      9,
      "—",
      -1,
      8,
      10,
      0.8,
      "O'tdi",
    ]);
    expect(row.getCell(3).note).toBe("Ozod: O'tkazilgan");
    expect(row.getCell(4).note).toBe("-1: Kechikish");
  });
});
