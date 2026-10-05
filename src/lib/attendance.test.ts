import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  attendanceFileName,
  buildAttendanceReport,
  buildAttendanceWorkbook,
  computeStats,
  HEADER_ROW,
  mostAbsent,
  type ReportInput,
} from "./attendance";

describe("computeStats", () => {
  it("LATE keldi, ABSENT kelmadi deb hisoblanadi", () => {
    expect(computeStats(["PRESENT", "LATE", "ABSENT", "PRESENT"])).toEqual({
      present: 3,
      absent: 1,
      late: 1,
      total: 4,
      percent: 75,
    });
  });

  it("yozuv bo'lmasa foiz null, yaxlitlash", () => {
    expect(computeStats([]).percent).toBeNull();
    expect(computeStats(["PRESENT", "ABSENT", "ABSENT"]).percent).toBe(33);
  });
});

const input: ReportInput = {
  currentStudents: [
    { id: "b", fullName: "Bobur" },
    { id: "a", fullName: "Anvar" },
    { id: "n", fullName: "Nodira (yangi)" },
  ],
  lessons: [
    {
      date: "2026-10-05",
      records: [
        {
          studentId: "a",
          studentName: "Anvar",
          status: "ABSENT",
          note: "kasal",
        },
        { studentId: "b", studentName: "Bobur", status: "PRESENT", note: null },
        {
          studentId: "x",
          studentName: "Xurshid (boshqa guruhga o'tgan)",
          status: "PRESENT",
          note: null,
        },
      ],
    },
    {
      date: "2026-10-02",
      records: [
        { studentId: "a", studentName: "Anvar", status: "LATE", note: null },
        { studentId: "b", studentName: "Bobur", status: "ABSENT", note: null },
        {
          studentId: "x",
          studentName: "Xurshid (boshqa guruhga o'tgan)",
          status: "ABSENT",
          note: null,
        },
      ],
    },
  ],
};

describe("buildAttendanceReport", () => {
  const report = buildAttendanceReport(input);

  it("sanalar o'sish tartibida, o'quvchilar alifbo bo'yicha, tarix saqlanadi", () => {
    expect(report.dates).toEqual(["2026-10-02", "2026-10-05"]);
    expect(report.students.map((s) => s.id)).toEqual(["a", "b", "n", "x"]);
  });

  it("kataklar va statistika; yozuvi yo'q katak foizga kirmaydi", () => {
    const [anvar, , nodira] = report.students;
    expect(anvar.cells.map((c) => c?.status)).toEqual(["LATE", "ABSENT"]);
    expect(anvar.stats).toMatchObject({ present: 1, absent: 1, percent: 50 });
    expect(nodira.cells).toEqual([null, null]);
    expect(nodira.stats.percent).toBeNull();
    expect(report.presentPerLesson).toEqual([1, 2]);
  });

  it("eng ko'p qoldirganlar", () => {
    expect(mostAbsent(report).map((s) => s.id)).toEqual(["a", "b", "x"]);
  });
});

describe("attendanceFileName", () => {
  it("to'liq oy va ixtiyoriy davr", () => {
    expect(attendanceFileName("Frontend-1", "2026-10-01", "2026-10-31")).toBe(
      "davomat_Frontend-1_2026-10.xlsx",
    );
    expect(attendanceFileName("A/B", "2026-10-01", "2026-10-15")).toBe(
      "davomat_A_B_2026-10-01_2026-10-15.xlsx",
    );
  });
});

describe("buildAttendanceWorkbook", () => {
  it("sarlavha, belgilar, ranglar, izoh, yig'indilar va muzlatish", async () => {
    const buffer = await buildAttendanceWorkbook(buildAttendanceReport(input), {
      groupName: "Frontend-1",
      schedule: "Du, Cho, Ju · 14:00–16:00",
      period: "01.10.2026 – 31.10.2026",
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    const values = (r: number) =>
      (sheet.getRow(r).values as unknown[]).slice(1);

    expect(sheet.getCell("A1").value).toBe("Guruh: Frontend-1");
    expect(sheet.getCell("A2").value).toBe(
      "Dars jadvali: Du, Cho, Ju · 14:00–16:00",
    );
    expect(values(HEADER_ROW)).toEqual([
      "O'quvchi",
      "02.10",
      "05.10",
      "Keldi",
      "Kelmadi",
      "Davomat %",
    ]);

    // Anvar: K (sariq), − (qizil, izoh bilan)
    expect(values(HEADER_ROW + 1)).toEqual(["Anvar", "K", "−", 1, 1, 0.5]);
    const absent = sheet.getCell(HEADER_ROW + 1, 3);
    expect(absent.fill).toMatchObject({ fgColor: { argb: "FFFFC7CE" } });
    expect(absent.note).toBeTruthy();
    expect(sheet.getCell(HEADER_ROW + 1, 2).fill).toMatchObject({
      fgColor: { argb: "FFFFEB9C" },
    });
    expect(sheet.getCell(HEADER_ROW + 1, 6).numFmt).toBe("0%");

    // Nodira: yozuv yo'q — kataklar bo'sh, foiz bo'sh
    expect(values(HEADER_ROW + 3)).toEqual([
      "Nodira (yangi)",
      undefined,
      undefined,
      0,
      0,
    ]);

    // Pastki qator: har bir dars bo'yicha kelganlar
    expect(values(HEADER_ROW + 5)).toEqual(["Kelganlar soni", 1, 2]);

    expect(sheet.views[0]).toMatchObject({
      state: "frozen",
      xSplit: 1,
      ySplit: HEADER_ROW,
    });
  });
});

describe("oldingi guruh davomati", () => {
  const moved: ReportInput = {
    currentStudents: [
      { id: "a", fullName: "Anvar" },
      { id: "m", fullName: "Malika (A dan o'tgan)" },
    ],
    lessons: [
      {
        date: "2026-10-06",
        records: [
          {
            studentId: "a",
            studentName: "Anvar",
            status: "PRESENT",
            note: null,
          },
          {
            studentId: "m",
            studentName: "Malika (A dan o'tgan)",
            status: "PRESENT",
            note: null,
          },
        ],
      },
    ],
    foreignRecords: [
      {
        date: "2026-10-01",
        studentId: "m",
        groupName: "Frontend-A",
        status: "ABSENT",
        note: "kasal",
      },
      {
        date: "2026-10-03",
        studentId: "m",
        groupName: "Frontend-A",
        status: "LATE",
        note: null,
      },
      // Shu sanada o'z guruhida ham yozuvi bor — o'z guruhi ustun
      {
        date: "2026-10-06",
        studentId: "m",
        groupName: "Frontend-A",
        status: "ABSENT",
        note: null,
      },
    ],
  };
  const report = buildAttendanceReport(moved);

  it("oldingi guruh sanalari ustun bo'lib qo'shiladi va belgilanadi", () => {
    expect(report.dates).toEqual(["2026-10-01", "2026-10-03", "2026-10-06"]);
    expect(report.foreignOnly).toEqual([true, true, false]);
  });

  it("kataklar fromGroup bilan, bir sanada o'z guruhi ustun; foizga kiradi", () => {
    const malika = report.students.find((s) => s.id === "m")!;
    expect(malika.cells).toEqual([
      { status: "ABSENT", note: "kasal", fromGroup: "Frontend-A" },
      { status: "LATE", note: null, fromGroup: "Frontend-A" },
      { status: "PRESENT", note: null, fromGroup: null },
    ]);
    expect(malika.stats).toMatchObject({ present: 2, absent: 1, total: 3 });

    const anvar = report.students.find((s) => s.id === "a")!;
    expect(anvar.cells).toEqual([
      null,
      null,
      { status: "PRESENT", note: null, fromGroup: null },
    ]);
  });

  it("kelganlar soni faqat shu guruh yozuvlari bo'yicha", () => {
    expect(report.presentPerLesson).toEqual([0, 0, 2]);
  });

  it("Excel: kulrang shrift, izohda guruh nomi, legenda, bo'sh yig'indi", async () => {
    const buffer = await buildAttendanceWorkbook(report, {
      groupName: "Frontend-B",
      schedule: "",
      period: "01.10.2026 – 31.10.2026",
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];

    expect(String(sheet.getCell("A4").value)).toContain("oldingi guruh");
    // Malika — 2-o'quvchi (alifbo bo'yicha), 01.10 — 2-ustun
    const cell = sheet.getCell(HEADER_ROW + 2, 2);
    expect(cell.value).toBe("−");
    expect(cell.font).toMatchObject({ color: { argb: "FF9CA3AF" } });
    expect(JSON.stringify(cell.note)).toContain("Oldingi guruh: Frontend-A");
    expect(JSON.stringify(cell.note)).toContain("kasal");
    expect(sheet.getCell(HEADER_ROW, 2).font).toMatchObject({ italic: true });

    const totals = sheet.getRow(HEADER_ROW + 3);
    expect(totals.getCell(2).value).toBeNull();
    expect(totals.getCell(4).value).toBe(2);
  });
});
