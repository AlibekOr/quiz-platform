import { describe, expect, it } from "vitest";
import {
  computeDurationSec,
  gradeAttempt,
  isAnswerCorrect,
  isWithinDeadline,
  markFromPercent,
  optionOrderFor,
  seededShuffle,
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

describe("markFromPercent", () => {
  it("< 60 — o'tmadi, 60–89 — 4, 90–100 — 5", () => {
    expect([0, 59, 60, 89, 90, 100].map(markFromPercent)).toEqual([
      "fail",
      "fail",
      4,
      4,
      5,
      5,
    ]);
  });
});

describe("seededShuffle", () => {
  const items = ["a", "b", "c", "d", "e"];

  it("bir xil urug' — bir xil tartib, elementlar yo'qolmaydi", () => {
    const first = seededShuffle(items, "attempt1:q1");
    expect(seededShuffle(items, "attempt1:q1")).toEqual(first);
    expect(first.toSorted()).toEqual(items);
  });

  it("har xil urug'lar har xil tartib beradi", () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, i) =>
        seededShuffle(items, `attempt${i}:q1`).join(""),
      ),
    );
    expect(orders.size).toBeGreaterThan(5);
  });
});

describe("optionOrderFor", () => {
  const options = ["a", "b", "c", "d"];

  it("aralashtirish o'chiq bo'lsa asl tartib", () => {
    expect(
      optionOrderFor({ id: "x", shuffleOptions: false }, "q1", options),
    ).toEqual(options);
  });

  it("yoqilgan bo'lsa urinish va savolga bog'liq, barqaror", () => {
    const attempt = { id: "x", shuffleOptions: true };
    expect(optionOrderFor(attempt, "q1", options)).toEqual(
      seededShuffle(options, "x:q1"),
    );
  });
});
