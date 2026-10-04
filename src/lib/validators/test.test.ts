import { describe, expect, it } from "vitest";
import {
  issueMessages,
  questionInputSchema,
  testSettingsSchema,
} from "./test";

const base = {
  text: "2 + 2 = ?",
  type: "SINGLE" as const,
  points: 1,
  options: [
    { text: "3", isCorrect: false },
    { text: "4", isCorrect: true },
  ],
};

function errorsOf(input: unknown) {
  const r = questionInputSchema.safeParse(input);
  return r.success ? [] : issueMessages(r.error);
}

describe("questionInputSchema", () => {
  it("to'g'ri SINGLE va MULTIPLE savollar", () => {
    expect(errorsOf(base)).toEqual([]);
    expect(
      errorsOf({
        ...base,
        type: "MULTIPLE",
        options: [
          { text: "a", isCorrect: true },
          { text: "b", isCorrect: true },
          { text: "c", isCorrect: false },
        ],
      }),
    ).toEqual([]);
  });

  it("kamida 2 ta variant va 1 ta to'g'ri javob", () => {
    expect(
      errorsOf({ ...base, options: [{ text: "4", isCorrect: true }] }),
    ).toContain("Kamida 2 ta variant kerak");
    expect(
      errorsOf({
        ...base,
        options: base.options.map((o) => ({ ...o, isCorrect: false })),
      }),
    ).toContain("Kamida 1 ta to'g'ri javob belgilang");
  });

  it("SINGLE da aynan 1 ta to'g'ri javob", () => {
    expect(
      errorsOf({
        ...base,
        options: base.options.map((o) => ({ ...o, isCorrect: true })),
      }),
    ).toContain("SINGLE savolda aynan 1 ta to'g'ri javob bo'ladi");
  });

  it("takror variantlar, bo'sh matn, noto'g'ri ball", () => {
    expect(
      errorsOf({
        ...base,
        options: [...base.options, { text: " 4 ", isCorrect: false }],
      }),
    ).toContain("Variantlar takrorlanmasin");
    expect(errorsOf({ ...base, text: "   " })).toContain(
      "Savol matnini kiriting",
    );
    expect(errorsOf({ ...base, points: 0 })).toContain("Ball kamida 1");
    expect(errorsOf({ ...base, points: 1.5 })).toContain(
      "Ball butun son bo'lsin",
    );
  });
});

describe("testSettingsSchema", () => {
  it("bo'sh tavsifni null qiladi va vaqtni songa aylantiradi", () => {
    const r = testSettingsSchema.parse({
      title: " CSS ",
      description: "  ",
      durationMin: "20",
      allowRetake: false,
      showAnswers: true,
      shuffleQuestions: false,
      groupIds: [],
    });
    expect(r).toMatchObject({
      title: "CSS",
      description: null,
      durationMin: 20,
    });
  });

  it("vaqt chegaralari", () => {
    const input = {
      title: "T",
      description: "",
      allowRetake: false,
      showAnswers: false,
      shuffleQuestions: false,
      groupIds: [],
    };
    expect(
      testSettingsSchema.safeParse({ ...input, durationMin: 0 }).success,
    ).toBe(false);
    expect(
      testSettingsSchema.safeParse({ ...input, durationMin: 301 }).success,
    ).toBe(false);
  });
});
