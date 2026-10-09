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

const ALWAYS = [{ from: "2026-09-01", to: null }];

const input: ReportInput = {
  members: [
    { id: "b", fullName: "Bobur", periods: ALWAYS, departure: null },
    { id: "a", fullName: "Anvar", periods: ALWAYS, departure: null },
    // 03.10 da qo'shilgan: 02.10 dagi dars a'zolik davridan tashqarida
    {
      id: "n",
      fullName: "Nodira (yangi)",
      periods: [{ from: "2026-10-03", to: null }],
      departure: null,
    },
    // 04.10 da boshqa guruhga o'tkazilgan
    {
      id: "x",
      fullName: "Xurshid",
      periods: [{ from: "2026-09-01", to: "2026-10-04" }],
      departure: { kind: "moved", groupName: "Frontend-2", date: "2026-10-04" },
    },
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
      ],
    },
    {
      date: "2026-10-02",
      records: [
        { studentId: "a", studentName: "Anvar", status: "LATE", note: null },
        { studentId: "b", studentName: "Bobur", status: "ABSENT", note: null },
        { studentId: "x", studentName: "Xurshid", status: "ABSENT", note: null },
        // A'zolik tarixi yo'q (eski yozuv): baribir ko'rsatiladi
        { studentId: "z", studentName: "Zafar", status: "PRESENT", note: null },
      ],
    },
  ],
};

describe("buildAttendanceReport", () => {
  const report = buildAttendanceReport(input);
  const byId = (id: string) => report.students.find((s) => s.id === id)!;

  it("sanalar o'sish tartibida; avval hozirgi a'zolar, keyin ketganlar, alifbo bo'yicha", () => {
    expect(report.dates).toEqual(["2026-10-02", "2026-10-05"]);
    expect(report.students.map((s) => s.id)).toEqual(["a", "b", "n", "z", "x"]);
  });

  it("kataklar va statistika; yozuvi yo'q katak foizga kirmaydi", () => {
    const anvar = byId("a");
    expect(anvar.cells.map((c) => c?.status)).toEqual(["LATE", "ABSENT"]);
    expect(anvar.stats).toMatchObject({ present: 1, absent: 1, percent: 50 });
    expect(byId("n").cells).toEqual([null, null]);
    expect(byId("n").stats.percent).toBeNull();
    expect(report.presentPerLesson).toEqual([2, 1]);
  });

  it("a'zolik davri: o'tkazish kuni yangi guruhga tegishli, oldingi kunlar tashqarida", () => {
    expect(byId("a").member).toEqual([true, true]);
    expect(byId("n").member).toEqual([false, true]);
    expect(byId("x").member).toEqual([true, false]);
    expect(byId("z").member).toEqual([false, false]);
    expect(byId("z").cells[0]?.status).toBe("PRESENT");
  });

  it("o'tkazilgan o'quvchi belgisi bilan qoladi, davomati foizda", () => {
    const x = byId("x");
    expect(x.departure).toEqual({
      kind: "moved",
      groupName: "Frontend-2",
      date: "2026-10-04",
    });
    expect(x.stats).toMatchObject({ absent: 1, total: 1 });
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

    // Nodira: yozuv yo'q — kataklar bo'sh, foiz bo'sh; 02.10 a'zolikdan tashqari (kulrang)
    expect(values(HEADER_ROW + 3)).toEqual([
      "Nodira (yangi)",
      undefined,
      undefined,
      0,
      0,
    ]);
    expect(sheet.getCell(HEADER_ROW + 3, 2).fill).toMatchObject({
      fgColor: { argb: "FFF3F4F6" },
    });
    expect(sheet.getCell(HEADER_ROW + 3, 3).fill).toBeUndefined();
    expect(String(sheet.getCell("A4").value)).toContain("bu guruhda bo'lmagan");

    // O'tkazilgan o'quvchi oxirida, nomi yonida belgi
    expect(sheet.getCell(HEADER_ROW + 5, 1).value).toBe(
      "Xurshid (o'tkazilgan: Frontend-2, 04.10.2026)",
    );
    expect(sheet.getCell(HEADER_ROW + 5, 1).font).toMatchObject({
      italic: true,
    });

    // Pastki qator: har bir dars bo'yicha kelganlar
    expect(values(HEADER_ROW + 6)).toEqual(["Kelganlar soni", 2, 1]);

    expect(sheet.views[0]).toMatchObject({
      state: "frozen",
      xSplit: 1,
      ySplit: HEADER_ROW,
    });
  });
});
