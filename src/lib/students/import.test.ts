import { describe, expect, it } from "vitest";
import {
  MAX_IMPORT_ROWS,
  sheetToRows,
  validateImportRows,
  type ImportRow,
} from "./import";

const HEADER = ["fullName", "username", "password", "group"];
const EMPTY_CONTACT = {
  phone: "",
  telegram: "",
  parentName: "",
  parentRelation: "",
  parentPhone: "",
};

function rowsOf(sheet: Parameters<typeof sheetToRows>[0]) {
  const result = sheetToRows(sheet);
  if ("error" in result) throw new Error(result.error);
  return result.rows;
}

function row(
  fields: Partial<ImportRow> & { line?: number },
): ImportRow & { line: number } {
  return {
    fullName: "Ali Valiyev",
    username: "ali",
    password: "secret1",
    group: "Frontend-1",
    ...EMPTY_CONTACT,
    line: 2,
    ...fields,
  };
}

describe("sheetToRows", () => {
  it("sarlavha bo'yicha ustunlarni topadi (tartib va registr muhim emas)", () => {
    const rows = rowsOf([
      ["Group", "PASSWORD", "fullname", "Username"],
      ["Frontend-1", "secret1", "Ali Valiyev", "ali"],
    ]);
    expect(rows).toEqual([row({})]);
  });

  it("bo'sh qatorlarni o'tkazib yuboradi, qator raqamini saqlaydi", () => {
    const rows = rowsOf([
      HEADER,
      ["A B", "ab", "123456", "G"],
      [null, "", null, ""],
      ["C D", "cd", 123456, "G"],
    ]);
    expect(rows.map((r) => r.line)).toEqual([2, 4]);
    expect(rows[1].password).toBe("123456");
  });

  it("majburiy ustun yetishmasa xato, aloqa ustunlari ixtiyoriy", () => {
    expect(sheetToRows([["fullName", "username", "password"]])).toEqual({
      error: expect.stringContaining('"group"'),
    });
    expect("rows" in sheetToRows([HEADER, ["A B", "ab1", "123456", "G"]])).toBe(
      true,
    );
  });

  it("bo'sh fayl va limitdan oshgan fayl", () => {
    expect(sheetToRows([])).toEqual({ error: "Fayl bo'sh" });
    expect(sheetToRows([HEADER])).toEqual({ error: "Faylda o'quvchilar yo'q" });
    const many = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => [
      "Ism Fam",
      `u${i}x`,
      "123456",
      "G",
    ]);
    expect(sheetToRows([HEADER, ...many])).toEqual({
      error: expect.stringContaining("ko'pi bilan"),
    });
  });
});

describe("validateImportRows", () => {
  const context = {
    existingUsernames: new Set(["student11"]),
    groupNames: new Set(["Frontend-1"]),
  };

  it("to'g'ri qatorda xato yo'q", () => {
    const [result] = validateImportRows(
      [row({ username: "ali.v", group: "frontend-1" })],
      context,
    );
    expect(result.errors).toEqual([]);
  });

  it("fayl ichidagi takror loginlarni ikkala qatorda ham belgilaydi", () => {
    const rows = validateImportRows(
      [row({ username: "ali" }), row({ username: "ALI", line: 3 })],
      context,
    );
    expect(
      rows.every((r) => r.errors.includes("Login faylda takrorlangan")),
    ).toBe(true);
  });

  it("bazada bor login va mavjud bo'lmagan guruhni rad etadi", () => {
    const [result] = validateImportRows(
      [row({ username: "Student11", group: "Yo'q" })],
      context,
    );
    expect(result.errors).toEqual([
      "Bunday login allaqachon mavjud",
      '"Yo\'q" guruhi topilmadi',
    ]);
  });

  it("maydon xatolarini qaytaradi", () => {
    const [result] = validateImportRows(
      [row({ fullName: "A", username: "a b", password: "123", group: "" })],
      context,
    );
    expect(result.errors).toEqual([
      "Ism kamida 2 belgi",
      "Login faqat lotin harflari, raqam, '.', '_' va '-' dan iborat bo'lsin",
      "Parol kamida 6 belgi",
      "Guruh nomini kiriting",
    ]);
  });
});

describe("aloqa ustunlari", () => {
  const context = {
    existingUsernames: new Set<string>(),
    groupNames: new Set(["G1"]),
  };

  it("sarlavhadan o'qiladi va normallashadi", () => {
    const rows = rowsOf([
      [
        ...HEADER,
        "phone",
        "telegram",
        "parentName",
        "parentRelation",
        "parentPhone",
      ],
      [
        "Ali Valiyev",
        "ali",
        "secret1",
        "G1",
        901234567,
        "t.me/ali_v",
        "Vali",
        "Ota",
        "+998 91 111 22 33",
      ],
    ]);
    const [result] = validateImportRows(rows, context);
    expect(result.errors).toEqual([]);
    expect(result.profile).toEqual({
      phone: "+998901234567",
      telegram: "@ali_v",
      parentName: "Vali",
      parentRelation: "FATHER",
      parentPhone: "+998911112233",
      note: null,
    });
  });

  it("noto'g'ri aloqa qiymatlari qator xatosi bo'ladi", () => {
    const [result] = validateImportRows(
      [
        row({
          group: "G1",
          phone: "123",
          telegram: "@ab",
          parentRelation: "buvi",
          parentPhone: "x",
        }),
      ],
      context,
    );
    expect(result.errors).toHaveLength(4);
    expect(result.errors[0]).toContain("phone");
  });
});
