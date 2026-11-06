import { describe, expect, it } from "vitest";
import type { AttendanceMark } from "./attendance";
import {
  compareRisk,
  computeRisk,
  DEFAULT_RISK_SETTINGS,
  forManager,
  isReviewActive,
  semesterFraction,
  trailingAbsences,
  type RiskInput,
  type RiskSignalKind,
} from "./risk";
import { addDays } from "./time";

const START = "2026-09-01";
const END = "2026-12-30"; // 120 kun
const semester = { startDate: START, endDate: END };

/** Xavfsiz o'quvchi: hamma narsa joyida */
function input(over: Partial<RiskInput> = {}): RiskInput {
  return {
    today: "2026-10-31", // f = 60 / 120 = 0.5
    semester,
    lessons: [],
    assignments: [],
    total: 30,
    passScore: 36,
    penalties: [],
    ...over,
  };
}

const lessons = (...marks: (AttendanceMark | null)[]) =>
  marks.map((mark, i) => ({ date: addDays("2026-10-01", i * 2), mark }));

/** 8 / 10 = 80% davomat, oxirgi 2 tasi ketma-ket kelmagan */
const twoAbsences = lessons(
  ...Array<AttendanceMark>(8).fill("PRESENT"),
  "ABSENT",
  "ABSENT",
);

const kinds = (r: ReturnType<typeof computeRisk>): RiskSignalKind[] =>
  r.signals.map((s) => s.kind);

describe("xavf yo'q", () => {
  it("hamma narsa joyida — daraja null", () => {
    expect(computeRisk(input())).toEqual({ level: null, signals: [] });
  });
});

describe("ketma-ket qoldirish", () => {
  it("1 ta — yo'q, 2 ta — bor", () => {
    expect(
      kinds(computeRisk(input({ lessons: lessons("PRESENT", "ABSENT") }))),
    ).toEqual([]);
    const r = computeRisk(
      input({
        lessons: twoAbsences,
      }),
    );
    expect(kinds(r)).toEqual(["CONSECUTIVE_ABSENCES"]);
    expect(r.signals[0].detail).toBe("2 dars ketma-ket qoldirgan");
  });

  it("belgilanmagan dars o'tkaziladi, sababli/kechikish zanjirni uzadi", () => {
    expect(trailingAbsences(lessons("ABSENT", null, "ABSENT"))).toBe(2);
    expect(trailingAbsences(lessons("ABSENT", "EXCUSED", "ABSENT"))).toBe(1);
    expect(trailingAbsences(lessons("ABSENT", "LATE", "ABSENT"))).toBe(1);
  });

  it("semestrdan oldingi darslar hisoblanmaydi", () => {
    const before = [
      { date: "2026-08-25", mark: "ABSENT" as const },
      { date: "2026-08-28", mark: "ABSENT" as const },
    ];
    expect(
      kinds(computeRisk(input({ lessons: [...before, ...lessons("ABSENT")] }))),
    ).toEqual([]);
  });
});

describe("davomat past", () => {
  it("4 darsdan kam bo'lsa tekshirilmaydi", () => {
    expect(
      kinds(
        computeRisk(
          input({ lessons: lessons("PRESENT", "EXCUSED", "EXCUSED") }),
        ),
      ),
    ).toEqual([]);
  });

  it("70% — yo'q, 67% — bor", () => {
    // 7 / 10 = 70%
    const ok = lessons(
      "PRESENT",
      "EXCUSED",
      "PRESENT",
      "EXCUSED",
      "PRESENT",
      "EXCUSED",
      "PRESENT",
      "PRESENT",
      "PRESENT",
      "PRESENT",
    );
    expect(kinds(computeRisk(input({ lessons: ok })))).toEqual([]);
    // 6 / 9 = 67%
    const low = ok.slice(0, 9);
    const r = computeRisk(input({ lessons: low }));
    expect(kinds(r)).toEqual(["LOW_ATTENDANCE"]);
    expect(r.signals[0].detail).toBe("davomat 67% (6 / 9 dars)");
  });
});

describe("vazifalar topshirilmagan", () => {
  const hw = (...points: (number | null)[]) =>
    points.map((p, i) => ({ dueDate: addDays("2026-10-01", i), points: p }));

  it("oxirgi 3 tadan 1 tasi — yo'q, 2 tasi — bor (0 ham, ball yo'q ham)", () => {
    expect(
      kinds(computeRisk(input({ assignments: hw(0, 0, 1, 1, 0) }))),
    ).toEqual([]);
    const r = computeRisk(input({ assignments: hw(1, 1, 1, 0, null) }));
    expect(kinds(r)).toEqual(["MISSED_ASSIGNMENTS"]);
    expect(r.signals[0].detail).toBe(
      "oxirgi 3 ta vazifadan 2 tasi topshirilmagan",
    );
  });

  it("muddati o'tmagan vazifa hisoblanmaydi", () => {
    const r = computeRisk(
      input({
        assignments: [
          { dueDate: "2026-10-31", points: null },
          { dueDate: "2026-11-02", points: null },
          { dueDate: "2026-10-20", points: 1 },
        ],
      }),
    );
    expect(kinds(r)).toEqual([]);
  });
});

describe("ball sur'ati", () => {
  it("semestr yarmida: kutilgan 18, chegara 14.4", () => {
    expect(semesterFraction(semester, "2026-10-31")).toBe(0.5);
    expect(kinds(computeRisk(input({ total: 14.5 })))).toEqual([]);
    const r = computeRisk(input({ total: 14 }));
    expect(kinds(r)).toEqual(["SCORE_PACE"]);
    expect(r.signals[0].detail).toBe("14 / 36 ball, kutilgan 18");
    expect(r.level).toBe("MEDIUM");
  });

  it("birinchi 14 kunda tekshirilmaydi", () => {
    expect(
      kinds(computeRisk(input({ today: "2026-09-14", total: 0 }))),
    ).toEqual([]);
    expect(
      kinds(computeRisk(input({ today: "2026-09-15", total: 0 }))),
    ).toEqual(["SCORE_PACE"]);
  });

  it("semestrning 70% dan keyin yolg'iz o'zi ham Yuqori", () => {
    // f = 84 / 120 = 0.7
    const r = computeRisk(input({ today: "2026-11-24", total: 10 }));
    expect(kinds(r)).toEqual(["SCORE_PACE"]);
    expect(r.level).toBe("HIGH");
  });
});

describe("jarimalar ko'p", () => {
  const today = "2026-10-31";
  const at = (days: number, points: number) => ({
    date: addDays(today, -days),
    points,
  });

  it("oxirgi 30 kunda 4.5 — yo'q, 5 — bor; eski jarima kirmaydi", () => {
    expect(
      kinds(
        computeRisk(input({ penalties: [at(0, 2.5), at(29, 2), at(30, 5)] })),
      ),
    ).toEqual([]);
    const r = computeRisk(input({ penalties: [at(0, 3), at(29, 2)] }));
    expect(kinds(r)).toEqual(["PENALTIES"]);
    expect(r.signals[0].detail).toBe("oxirgi 30 kunda −5 ball jarima");
  });
});

describe("daraja va sozlamalar", () => {
  const absent = twoAbsences;

  it("2 ta signal — Yuqori", () => {
    const r = computeRisk(input({ lessons: absent, total: 10 }));
    expect(kinds(r)).toEqual(["CONSECUTIVE_ABSENCES", "SCORE_PACE"]);
    expect(r.level).toBe("HIGH");
  });

  it("o'chirilgan signal ishlamaydi, chegara sozlanadi", () => {
    const settings = {
      ...DEFAULT_RISK_SETTINGS,
      scorePace: { ...DEFAULT_RISK_SETTINGS.scorePace, enabled: false },
      consecutiveAbsences: { enabled: true, min: 3 },
    };
    expect(computeRisk(input({ lessons: absent, total: 0 }), settings)).toEqual(
      { level: null, signals: [] },
    );
  });
});

describe("menejer", () => {
  it("ball va jarima signallari olib tashlanadi, daraja qayta hisoblanadi", () => {
    const r = computeRisk(
      input({
        lessons: twoAbsences,
        total: 0,
        penalties: [{ date: "2026-10-30", points: 6 }],
      }),
    );
    expect(r.level).toBe("HIGH");
    const m = forManager(r);
    expect(kinds(m)).toEqual(["CONSECUTIVE_ABSENCES"]);
    expect(m.level).toBe("MEDIUM");
    expect(JSON.stringify(m)).not.toMatch(/ball/);
  });
});

describe("ko'rib chiqildi", () => {
  const absent = twoAbsences;
  const medium = computeRisk(input({ lessons: absent }));
  const high = computeRisk(input({ lessons: absent, total: 5 }));
  const review = {
    hideUntil: "2026-11-07",
    signalKinds: ["CONSECUTIVE_ABSENCES"] as RiskSignalKind[],
  };

  it("hideUntil gacha amal qiladi", () => {
    expect(isReviewActive(review, medium.signals, "2026-11-06")).toBe(true);
    expect(isReviewActive(review, medium.signals, "2026-11-07")).toBe(false);
  });

  it("yangi signal paydo bo'lsa darhol yana ko'tariladi", () => {
    expect(isReviewActive(review, high.signals, "2026-11-01")).toBe(false);
  });

  it("tartib: ko'rib chiqilmaganlar, keyin daraja", () => {
    const rows = [
      { fullName: "Vali", risk: high, reviewed: true },
      { fullName: "Ali", risk: medium, reviewed: false },
      { fullName: "Bek", risk: high, reviewed: false },
    ].sort(compareRisk);
    expect(rows.map((x) => x.fullName)).toEqual(["Bek", "Ali", "Vali"]);
  });
});
