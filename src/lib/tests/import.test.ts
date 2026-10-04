import { describe, expect, it } from "vitest";
import { parseJsonQuestions, sheetToQuestions } from "./import";

function questionsOf(result: ReturnType<typeof parseJsonQuestions>) {
  if ("error" in result) throw new Error(result.error);
  return result.questions;
}

describe("parseJsonQuestions", () => {
  it("to'g'ri JSON", () => {
    const [q] = questionsOf(
      parseJsonQuestions(
        JSON.stringify([
          {
            text: "HTML nima?",
            type: "single",
            points: 2,
            options: [
              { text: "Til", isCorrect: true },
              { text: "Kutubxona", isCorrect: false },
            ],
          },
        ]),
      ),
    );
    expect(q.errors).toEqual([]);
    expect(q.question).toMatchObject({ type: "SINGLE", points: 2 });
  });

  it("type va points berilmasa SINGLE va 1", () => {
    const [q] = questionsOf(
      parseJsonQuestions(
        JSON.stringify([
          {
            text: "?",
            options: [{ text: "a", isCorrect: true }, { text: "b" }],
          },
        ]),
      ),
    );
    expect(q.question).toMatchObject({ type: "SINGLE", points: 1 });
  });

  it("xatolar har bir savol uchun alohida", () => {
    const qs = questionsOf(
      parseJsonQuestions(
        JSON.stringify([
          {
            text: "ok",
            options: [{ text: "a", isCorrect: true }, { text: "b" }],
          },
          { text: "", options: [] },
          "satr",
        ]),
      ),
    );
    expect(qs.map((q) => q.errors.length > 0)).toEqual([false, true, true]);
    expect(qs[1].line).toBe(2);
  });

  it("noto'g'ri JSON va massiv bo'lmagan qiymat", () => {
    expect(parseJsonQuestions("{")).toEqual({
      error: "JSON formati noto'g'ri",
    });
    expect(parseJsonQuestions("{}")).toEqual({
      error: expect.stringContaining("massiv"),
    });
    expect(parseJsonQuestions("[]")).toEqual({ error: "Faylda savollar yo'q" });
  });
});

describe("sheetToQuestions", () => {
  const header = ["text", "type", "points", "A", "B", "C", "D", "correct"];

  it("SINGLE va MULTIPLE qatorlar, bo'sh variantlar tashlanadi", () => {
    const qs = questionsOf(
      sheetToQuestions([
        header,
        ["Rang xususiyati?", "SINGLE", 1, "color", "font", "", "", "A"],
        ["Birliklar?", "multiple", 2, "rem", "px", "deg", "", "A, B"],
      ]),
    );
    expect(qs.map((q) => q.errors)).toEqual([[], []]);
    expect(qs[0].question?.options).toHaveLength(2);
    expect(qs[1].question).toMatchObject({ type: "MULTIPLE", points: 2 });
    expect(
      qs[1].question?.options.filter((o) => o.isCorrect).map((o) => o.text),
    ).toEqual(["rem", "px"]);
  });

  it("type bo'sh bo'lsa to'g'ri javoblar soniga qarab aniqlanadi", () => {
    const qs = questionsOf(
      sheetToQuestions([
        header,
        ["?", "", "", "a", "b", "c", "", "A,C"],
        ["?", "", "", "a", "b", "", "", "b"],
      ]),
    );
    expect(qs.map((q) => q.question?.type)).toEqual(["MULTIPLE", "SINGLE"]);
  });

  it("bo'sh variantga ishora qilgan correct xato", () => {
    const [q] = questionsOf(
      sheetToQuestions([header, ["?", "SINGLE", 1, "a", "b", "", "", "C"]]),
    );
    expect(q.question).toBeNull();
    expect(q.errors[0]).toBe("To'g'ri javob \"C\" varianti bo'sh yoki yo'q");
    expect(q.line).toBe(2);
  });

  it("SINGLE ga ikkita to'g'ri javob va noto'g'ri ball", () => {
    const [q1, q2] = questionsOf(
      sheetToQuestions([
        header,
        ["?", "SINGLE", 1, "a", "b", "", "", "A,B"],
        ["?", "SINGLE", "abc", "a", "b", "", "", "A"],
      ]),
    );
    expect(q1.errors).toContain(
      "SINGLE savolda aynan 1 ta to'g'ri javob bo'ladi",
    );
    expect(q2.errors).toContain("Ball son bo'lsin");
  });

  it("majburiy ustun yetishmasa xato", () => {
    expect(sheetToQuestions([["text", "A", "B"]])).toEqual({
      error: expect.stringContaining('"correct"'),
    });
  });
});
