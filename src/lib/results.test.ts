import { describe, expect, it } from "vitest";
import {
  buildResultsCsv,
  buildStudentRows,
  computeQuestionStats,
  csvCell,
  hardestQuestions,
  sortRows,
  type ResultAttempt,
  type ResultStudent,
  type StatQuestion,
} from "./results";

const student = (id: string, fullName: string): ResultStudent => ({
  id,
  fullName,
  groupName: "G1",
  isActive: true,
});

let seq = 0;
function attempt(
  userId: string,
  data: Partial<ResultAttempt> & { score?: number; durationSec?: number },
): ResultAttempt {
  seq++;
  return {
    id: `a${seq}`,
    userId,
    status: "FINISHED",
    isFirst: false,
    maxScore: 10,
    startedAt: new Date(Date.UTC(2026, 9, 1, 9, seq)),
    score: 0,
    durationSec: 100,
    ...data,
  };
}

describe("buildStudentRows", () => {
  it("birinchi, eng yaxshi urinish va urinishlar soni", () => {
    const rows = buildStudentRows(
      [student("u1", "Ali"), student("u2", "Bek")],
      [
        attempt("u1", { isFirst: true, score: 4, durationSec: 300 }),
        attempt("u1", { score: 9, durationSec: 200 }),
        attempt("u1", { score: 9, durationSec: 150 }),
        attempt("u1", { status: "IN_PROGRESS", score: undefined }),
      ],
    );
    const ali = rows[0];
    expect(ali.attemptCount).toBe(3);
    expect(ali.first).toMatchObject({ score: 4, percent: 40 });
    expect(ali.best).toMatchObject({ score: 9, durationSec: 150 });
    expect(ali.inProgressId).not.toBeNull();

    const bek = rows[1];
    expect(bek).toMatchObject({
      attemptCount: 0,
      first: null,
      best: null,
      inProgressId: null,
    });
  });

  it("eng yaxshi urinish foiz bo'yicha (maxScore o'zgargan bo'lsa ham)", () => {
    const [row] = buildStudentRows(
      [student("u1", "Ali")],
      [
        attempt("u1", { isFirst: true, score: 8, maxScore: 10 }),
        attempt("u1", { score: 9, maxScore: 12 }),
      ],
    );
    expect(row.best?.percent).toBe(80);
  });
});

describe("sortRows", () => {
  const rows = buildStudentRows(
    [
      student("u1", "Ali"),
      student("u2", "Bek"),
      student("u3", "Dil"),
      student("u4", "Vali"),
    ],
    [
      attempt("u1", { isFirst: true, score: 7, durationSec: 300 }),
      attempt("u2", { isFirst: true, score: 9, durationSec: 500 }),
      attempt("u3", { isFirst: true, score: 7, durationSec: 200 }),
      attempt("u3", { score: 10, durationSec: 100 }),
    ],
  );
  const names = (r: ReturnType<typeof sortRows>) =>
    r.map((x) => x.student.fullName);

  it("birinchi urinish: foiz kamayish, teng bo'lsa vaqt kam; ishlamagan oxirida", () => {
    expect(names(sortRows(rows, "first", "desc"))).toEqual([
      "Bek",
      "Dil",
      "Ali",
      "Vali",
    ]);
    expect(names(sortRows(rows, "first", "asc"))).toEqual([
      "Dil",
      "Ali",
      "Bek",
      "Vali",
    ]);
  });

  it("eng yaxshi, urinishlar soni va ism bo'yicha", () => {
    expect(names(sortRows(rows, "best", "desc"))[0]).toBe("Dil");
    expect(names(sortRows(rows, "attempts", "desc"))[0]).toBe("Dil");
    expect(names(sortRows(rows, "name", "desc"))).toEqual([
      "Vali",
      "Dil",
      "Bek",
      "Ali",
    ]);
  });
});

describe("savollar statistikasi", () => {
  const questions: StatQuestion[] = [
    {
      id: "q1",
      text: "Oson",
      type: "SINGLE",
      points: 1,
      options: [
        { id: "a", text: "A", isCorrect: true },
        { id: "b", text: "B", isCorrect: false },
      ],
    },
    {
      id: "q2",
      text: "Qiyin",
      type: "MULTIPLE",
      points: 1,
      options: [
        { id: "c", text: "C", isCorrect: true },
        { id: "d", text: "D", isCorrect: true },
        { id: "e", text: "E", isCorrect: false },
      ],
    },
  ];

  it("javob bermaganlar noto'g'ri hisoblanadi, variantlar tanlanishi sanaladi", () => {
    const stats = computeQuestionStats(
      questions,
      [
        { questionId: "q1", selectedOptionIds: ["a"], isCorrect: true },
        { questionId: "q1", selectedOptionIds: ["a"], isCorrect: true },
        { questionId: "q1", selectedOptionIds: ["b"], isCorrect: false },
        { questionId: "q2", selectedOptionIds: ["c", "d"], isCorrect: true },
        { questionId: "q2", selectedOptionIds: ["c"], isCorrect: false },
        { questionId: "q2", selectedOptionIds: [], isCorrect: false },
      ],
      4,
    );
    expect(stats[0]).toMatchObject({
      number: 1,
      correct: 2,
      answered: 3,
      total: 4,
      percent: 50,
    });
    expect(stats[0].options.map((o) => o.picks)).toEqual([2, 1]);
    expect(stats[1]).toMatchObject({ correct: 1, answered: 2, percent: 25 });
    expect(stats[1].options.map((o) => o.picks)).toEqual([2, 1, 0]);

    expect(hardestQuestions(stats, 1).map((s) => s.id)).toEqual(["q2"]);
  });

  it("urinishlar bo'lmasa qiyin savollar ro'yxati bo'sh", () => {
    expect(hardestQuestions(computeQuestionStats(questions, [], 0))).toEqual(
      [],
    );
  });
});

describe("CSV", () => {
  it("katakni qochirish va formula in'ektsiyasidan himoya", () => {
    expect(csvCell("Ali")).toBe("Ali");
    expect(csvCell('O"zbek; test')).toBe('"O""zbek; test"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(-5)).toBe("-5");
  });

  it("BOM, sarlavha va qatorlar", () => {
    const rows = buildStudentRows(
      [student("u1", "Ali"), student("u2", "Bek")],
      [
        attempt("u1", {
          isFirst: true,
          score: 8,
          durationSec: 125,
          startedAt: new Date("2026-10-04T09:05:00Z"),
        }),
      ],
    );
    const csv = buildResultsCsv(rows);
    expect(csv.startsWith("﻿№;F.I.Sh.;Guruh;")).toBe(true);
    const lines = csv.trimEnd().split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe(
      "1;Ali;G1;8;10;80%;2:05;Topshirilgan;04.10.2026, 14:05;8;80%;1",
    );
    expect(lines[2]).toBe("2;Bek;G1;;;;;Ishlamagan;;;;0");
  });
});
