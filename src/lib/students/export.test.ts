import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { fileSafe } from "@/lib/format";
import { buildStudentsWorkbook, EXPORT_HEADERS } from "./export";

describe("buildStudentsWorkbook", () => {
  it("sarlavha va qatorlar, parolsiz", async () => {
    const buffer = await buildStudentsWorkbook(
      [
        {
          fullName: "Ali Valiyev",
          username: "ali",
          groupName: "G1",
          isActive: true,
          profile: {
            phone: "+998901234567",
            telegram: "@ali_v",
            parentName: "Vali",
            parentRelation: "FATHER",
            parentPhone: "+998911112233",
            note: null,
          },
        },
        {
          fullName: "Bek",
          username: "bek",
          groupName: null,
          isActive: false,
          profile: null,
        },
      ],
      "test",
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    const values = (n: number) =>
      (sheet.getRow(n).values as unknown[]).slice(1);

    expect(values(1)).toEqual([...EXPORT_HEADERS]);
    expect(values(2)).toEqual([
      "Ali Valiyev",
      "ali",
      "G1",
      "Faol",
      "+998901234567",
      "@ali_v",
      "Vali",
      "Ota",
      "+998911112233",
    ]);
    expect(values(3).slice(0, 4)).toEqual([
      "Bek",
      "bek",
      undefined,
      "Bloklangan",
    ]);
    expect(EXPORT_HEADERS.some((h) => /parol|password/i.test(h))).toBe(false);
  });
});

describe("fileSafe", () => {
  it("fayl nomiga yaroqli qiladi", () => {
    expect(fileSafe("Frontend-1")).toBe("Frontend-1");
    expect(fileSafe("A/B guruh")).toBe("A_B_guruh");
    expect(fileSafe("///")).toBe("guruh");
  });
});
