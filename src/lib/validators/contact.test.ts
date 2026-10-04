import { describe, expect, it } from "vitest";
import {
  normalizePhone,
  normalizeTelegram,
  parseParentRelation,
  studentProfileSchema,
  telegramUrl,
} from "./contact";

describe("normalizePhone", () => {
  it.each([
    ["90 123 45 67", "+998901234567"],
    ["901234567", "+998901234567"],
    ["+998 90 123-45-67", "+998901234567"],
    ["998901234567", "+998901234567"],
    ["(90) 123 45 67", "+998901234567"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    "12345",
    "+1 202 555 0100",
    "90 123 45 6",
    "abc",
    "+90123456789",
    "",
  ])("%s noto'g'ri", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("normalizeTelegram", () => {
  it.each([
    ["@ali_valiyev", "@ali_valiyev"],
    ["ali_valiyev", "@ali_valiyev"],
    ["https://t.me/ali_valiyev", "@ali_valiyev"],
    ["t.me/AliV2026", "@AliV2026"],
    ["90 123 45 67", "+998901234567"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeTelegram(input)).toBe(expected);
  });

  it.each(["@abc", "@1user", "@user-name", "@" + "a".repeat(33)])(
    "%s noto'g'ri",
    (input) => {
      expect(normalizeTelegram(input)).toBeNull();
    },
  );

  it("havola", () => {
    expect(telegramUrl("@ali")).toBe("https://t.me/ali");
    expect(telegramUrl("+998901234567")).toBe("https://t.me/+998901234567");
  });
});

describe("parseParentRelation", () => {
  it("o'zbekcha va inglizcha qiymatlar", () => {
    expect(parseParentRelation("Ota")).toBe("FATHER");
    expect(parseParentRelation("ona")).toBe("MOTHER");
    expect(parseParentRelation("OTHER")).toBe("OTHER");
    expect(parseParentRelation("")).toBeNull();
    expect(parseParentRelation("buvi")).toBeNull();
  });
});

describe("studentProfileSchema", () => {
  it("bo'sh maydonlar null bo'ladi, telefonlar normallashadi", () => {
    expect(
      studentProfileSchema.parse({
        phone: "90 123 45 67",
        telegram: "",
        parentName: "  ",
        parentRelation: "",
        parentPhone: "+998 91 000 00 00",
        note: undefined,
      }),
    ).toEqual({
      phone: "+998901234567",
      telegram: null,
      parentName: null,
      parentRelation: null,
      parentPhone: "+998910000000",
      note: null,
    });
  });

  it("noto'g'ri telefon xato beradi", () => {
    const result = studentProfileSchema.safeParse({ phone: "123" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["phone"],
      message: expect.stringContaining("Telefon"),
    });
  });
});
