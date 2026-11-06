import { describe, expect, it } from "vitest";
import {
  bankQuestionFormSchema,
  parseDifficulty,
  parseTags,
  pickInputSchema,
} from "./bank";

describe("bank validatorlari", () => {
  it("teglar: bo'shliqlar, bo'shlar va takrorlar (katta-kichik harf) tashlanadi", () => {
    expect(parseTags(" flex,  CSS  layout ,,Flex, ")).toEqual([
      "flex",
      "CSS layout",
    ]);
  });

  it("qiyinlik: inglizcha va o'zbekcha, apostrof turlari bilan", () => {
    expect(parseDifficulty("easy")).toBe("EASY");
    expect(parseDifficulty("O‘rta")).toBe("MEDIUM");
    expect(parseDifficulty(" QIYIN ")).toBe("HARD");
    expect(parseDifficulty("")).toBeNull();
    expect(parseDifficulty("juda qiyin")).toBeNull();
  });

  it("forma: bo'sh variantlar tashlanadi, izoh bo'sh bo'lsa null", () => {
    const parsed = bankQuestionFormSchema.parse({
      text: " Savol ",
      type: "SINGLE",
      points: 1,
      options: [
        { text: "A", isCorrect: true },
        { text: " ", isCorrect: false },
        { text: "B", isCorrect: false },
      ],
      topicId: "t1",
      difficulty: "EASY",
      explanation: "  ",
      tags: "a, b",
    });
    expect(parsed).toMatchObject({
      text: "Savol",
      explanation: null,
      tags: ["a", "b"],
    });
    expect(parsed.options).toHaveLength(2);
  });

  it("forma: SINGLE savolda ikkita to'g'ri javob — xato", () => {
    const result = bankQuestionFormSchema.safeParse({
      text: "Savol",
      type: "SINGLE",
      points: 1,
      options: [
        { text: "A", isCorrect: true },
        { text: "B", isCorrect: true },
      ],
      topicId: "t1",
      difficulty: "EASY",
      explanation: "",
      tags: "",
    });
    expect(result.success).toBe(false);
  });

  it("avtomatik yig'ish: qoida soni va qiymatlari tekshiriladi", () => {
    expect(
      pickInputSchema.safeParse({ rules: [], excludeUsed: false }).success,
    ).toBe(false);
    expect(
      pickInputSchema.safeParse({
        rules: [{ topicId: "t", difficulty: null, count: 0 }],
        excludeUsed: false,
      }).success,
    ).toBe(false);
    expect(
      pickInputSchema.safeParse({
        rules: [{ topicId: "t", difficulty: "HARD", count: 5 }],
        excludeUsed: true,
      }).success,
    ).toBe(true);
  });
});
