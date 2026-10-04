import { describe, expect, it } from "vitest";
import { MAX_IMPORT_ROWS, sheetToRows, validateImportRows } from "./import";

const HEADER = ["fullName", "username", "password", "group"];

function rowsOf(sheet: Parameters<typeof sheetToRows>[0]) {
  const result = sheetToRows(sheet);
  if ("error" in result) throw new Error(result.error);
  return result.rows;
}

describe("sheetToRows", () => {
  it("sarlavha bo'yicha ustunlarni topadi (tartib va registr muhim emas)", () => {
    const rows = rowsOf([
      ["Group", "PASSWORD", "fullname", "Username"],
      ["Frontend-1", "secret1", "Ali Valiyev", "ali"],
    ]);
    expect(rows).toEqual([
      {
        fullName: "Ali Valiyev",
        username: "ali",
        password: "secret1",
        group: "Frontend-1",
        line: 2,
      },
    ]);
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

  it("ustun yetishmasa xato", () => {
    const result = sheetToRows([["fullName", "username", "password"]]);
    expect(result).toEqual({ error: expect.stringContaining('"group"') });
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
    const [row] = validateImportRows(
      [
        {
          fullName: "Ali Valiyev",
          username: "ali.v",
          password: "secret1",
          group: "frontend-1",
          line: 2,
        },
      ],
      context,
    );
    expect(row.errors).toEqual([]);
  });

  it("fayl ichidagi takror loginlarni ikkala qatorda ham belgilaydi", () => {
    const rows = validateImportRows(
      [
        {
          fullName: "Ali Valiyev",
          username: "ali",
          password: "secret1",
          group: "Frontend-1",
          line: 2,
        },
        {
          fullName: "Ali Karimov",
          username: "ALI",
          password: "secret2",
          group: "Frontend-1",
          line: 3,
        },
      ],
      context,
    );
    expect(
      rows.every((r) => r.errors.includes("Login faylda takrorlangan")),
    ).toBe(true);
  });

  it("bazada bor login va mavjud bo'lmagan guruhni rad etadi", () => {
    const [row] = validateImportRows(
      [
        {
          fullName: "Ali Valiyev",
          username: "Student11",
          password: "secret1",
          group: "Yo'q",
          line: 2,
        },
      ],
      context,
    );
    expect(row.errors).toEqual([
      "Bunday login allaqachon mavjud",
      '"Yo\'q" guruhi topilmadi',
    ]);
  });

  it("maydon xatolarini qaytaradi", () => {
    const [row] = validateImportRows(
      [{ fullName: "A", username: "a b", password: "123", group: "", line: 2 }],
      context,
    );
    expect(row.errors).toEqual([
      "Ism kamida 2 belgi",
      "Login faqat lotin harflari, raqam, '.', '_' va '-' dan iborat bo'lsin",
      "Parol kamida 6 belgi",
      "Guruh nomini kiriting",
    ]);
  });
});
