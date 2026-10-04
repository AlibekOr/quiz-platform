import { describe, expect, it } from "vitest";
import {
  computeDurationSec,
  gradeAttempt,
  isAnswerCorrect,
  isWithinDeadline,
  shuffle,
  type GradableQuestion,
} from "./grading";

const single: GradableQuestion = {
  id: "q1",
  type: "SINGLE",
  points: 1,
  options: [
    { id: "a", isCorrect: false },
    { id: "b", isCorrect: true },
    { id: "c", isCorrect: false },
  ],
};

const multiple: GradableQuestion = {
  id: "q2",
  type: "MULTIPLE",
  points: 3,
  options: [
    { id: "x", isCorrect: true },
    { id: "y", isCorrect: true },
    { id: "z", isCorrect: false },
  ],
};

describe("isAnswerCorrect", () => {
  it("SINGLE: faqat to'g'ri variant tanlansa", () => {
    expect(isAnswerCorrect(single, ["b"])).toBe(true);
    expect(isAnswerCorrect(single, ["a"])).toBe(false);
    // SINGLE ga bir nechta variant yuborilsa ham to'g'ri hisoblanmaydi
    expect(isAnswerCorrect(single, ["a", "b"])).toBe(false);
  });

  it("MULTIPLE: to'plamlar aynan teng bo'lishi kerak, qisman ball yo'q", () => {
    expect(isAnswerCorrect(multiple, ["y", "x"])).toBe(true);
    expect(isAnswerCorrect(multiple, ["x"])).toBe(false);
    expect(isAnswerCorrect(multiple, ["x", "y", "z"])).toBe(false);
    expect(isAnswerCorrect(multiple, ["x", "x"])).toBe(false);
  });

  it("javobsiz yoki begona variant", () => {
    expect(isAnswerCorrect(single, undefined)).toBe(false);
    expect(isAnswerCorrect(single, [])).toBe(false);
    expect(isAnswerCorrect(multiple, ["x", "other"])).toBe(false);
  });
});

describe("gradeAttempt", () => {
  it("ball va maxScore", () => {
    const result = gradeAttempt(
      [single, multiple],
      new Map([
        ["q1", ["b"]],
        ["q2", ["x"]],
      ]),
    );
    expect(result.score).toBe(1);
    expect(result.maxScore).toBe(4);
    expect(result.correctness).toEqual(
      new Map([
        ["q1", true],
        ["q2", false],
      ]),
    );
  });

  it("hech narsa javob berilmagan", () => {
    const result = gradeAttempt([single, multiple], new Map());
    expect(result).toMatchObject({ score: 0, maxScore: 4 });
  });

  it("hammasi to'g'ri", () => {
    expect(
      gradeAttempt(
        [single, multiple],
        new Map([
          ["q1", ["b"]],
          ["q2", ["x", "y"]],
        ]),
      ).score,
    ).toBe(4);
  });
});

describe("muddat qoidalari", () => {
  const deadline = new Date("2026-10-04T10:00:00Z");

  it("deadline + 5s gacha qabul qilinadi, keyin yo'q", () => {
    expect(isWithinDeadline(deadline, new Date("2026-10-04T09:59:59Z"))).toBe(
      true,
    );
    expect(isWithinDeadline(deadline, new Date("2026-10-04T10:00:05Z"))).toBe(
      true,
    );
    expect(
      isWithinDeadline(deadline, new Date("2026-10-04T10:00:05.001Z")),
    ).toBe(false);
  });

  it("sarflangan vaqt test vaqtidan oshmaydi", () => {
    const start = new Date("2026-10-04T09:50:00Z");
    expect(
      computeDurationSec(start, new Date("2026-10-04T09:53:20Z"), 10),
    ).toBe(200);
    expect(
      computeDurationSec(start, new Date("2026-10-04T10:00:04Z"), 10),
    ).toBe(600);
    expect(
      computeDurationSec(start, new Date("2026-10-04T09:49:00Z"), 10),
    ).toBe(0);
  });
});

describe("shuffle", () => {
  it("elementlarni yo'qotmaydi va asl massivni o'zgartirmaydi", () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items);
    expect([...result].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it("random berilganda deterministik", () => {
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
});
