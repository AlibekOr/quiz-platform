import { describe, expect, it } from "vitest";
import { DEFAULT_RULES } from "./grades";
import { semesterProgress } from "./grades-progress";

const data = {
  semester: {
    id: "s1",
    name: "1-semestr",
    startDate: "2026-10-01", // payshanba
    endDate: "2026-12-31",
    closed: false,
    ended: false,
    rules: DEFAULT_RULES,
    group: { id: "g1", name: "Frontend-1" },
  },
  assignments: [
    {
      id: "hw",
      category: "HOMEWORK" as const,
      title: "UV",
      dueDate: "2026-10-02",
      maxPoints: 1,
    },
    {
      id: "pr",
      category: "PRACTICAL" as const,
      title: "Amaliy",
      dueDate: "2026-10-09",
      maxPoints: 25,
    },
  ],
};

const student = {
  grades: {
    hw: { points: 1, note: null },
    pr: { points: 25, note: null },
  },
  oral: [{ date: "2026-10-15", points: 1, note: null }],
  penalties: [
    {
      id: "p1",
      points: 1,
      name: "Kechikish",
      note: null,
      date: "2026-10-16",
      auto: false,
    },
  ],
  adjustments: [{ id: "a1", points: 2, reason: "Ko'chirilgan" }],
};

describe("semesterProgress", () => {
  it("har yakshanba va bugungacha; ballar sanasi bo'yicha qo'shiladi", () => {
    expect(semesterProgress(data, student, "2026-10-20")).toEqual([
      // UV 1 + tuzatish 2
      { date: "2026-10-04", total: 3 },
      // + amaliy 25, lekin chegarasi 20
      { date: "2026-10-11", total: 23 },
      // + og'zaki 1, − jarima 1
      { date: "2026-10-18", total: 23 },
      { date: "2026-10-20", total: 23 },
    ]);
  });

  it("semestr hali boshlanmagan bo'lsa bo'sh", () => {
    expect(semesterProgress(data, student, "2026-09-30")).toEqual([]);
  });

  it("semestr tugagan bo'lsa oxirgi kun — semestr oxiri", () => {
    const points = semesterProgress(data, student, "2027-02-01");
    expect(points.at(-1)).toEqual({ date: "2026-12-31", total: 23 });
    expect(points.at(-2)?.date).toBe("2026-12-27");
  });
});
