import { describe, expect, it } from "vitest";
import {
  canReceiveExtra,
  categoryText,
  computeSemesterResult,
  DEFAULT_RULES,
  EMPTY_SUMS,
  formatPoints,
  autoPenalties,
  isFinalStretch,
  isSemesterEnded,
  isValidPoints,
  passScore,
  rankByTotal,
  type PointSums,
} from "./grades";

const rules = DEFAULT_RULES;
const sums = (s: Partial<PointSums>): PointSums => ({ ...EMPTY_SUMS, ...s });
const ended = (s: Partial<PointSums>) =>
  computeSemesterResult(rules, sums(s), true);

describe("kategoriya chegaralari", () => {
  it("30 / 20 / 10 / 40, bonus chegarasiz", () => {
    const r = computeSemesterResult(
      { ...rules, maxTotal: 1000 },
      sums({ homework: 45, practical: 33, oral: 12.5, extra: 50, bonus: 7 }),
      true,
    );
    expect(r.categories.HOMEWORK).toEqual({ earned: 45, cap: 30, counted: 30 });
    expect(r.categories.PRACTICAL.counted).toBe(20);
    expect(r.categories.ORAL.counted).toBe(10);
    expect(r.categories.EXTRA.counted).toBe(40);
    expect(r.categories.BONUS).toEqual({ earned: 7, cap: null, counted: 7 });
    expect(r.total).toBe(30 + 20 + 10 + 40 + 7);
  });
});

describe("jami 60 dan oshmaydi", () => {
  it("hammasi to'liq va bonus, tuzatish bilan ham", () => {
    const r = ended({
      homework: 30,
      practical: 20,
      oral: 10,
      bonus: 15,
      adjustments: 5,
    });
    expect(r.total).toBe(60);
    expect(r.withoutExtra).toBe(60);
    expect(r.status).toBe("PASSED");
  });

  it("EXTRA bilan ham 60 dan oshmaydi", () => {
    expect(ended({ homework: 30, practical: 20, extra: 40 }).total).toBe(60);
  });
});

describe("jarimalar", () => {
  it("60 lik chegaradan keyin ayiriladi", () => {
    // 30 + 20 + 10 + 10 bonus = 70 -> 60, keyin −5 = 55 (70 − 5 = 65 emas)
    const r = ended({
      homework: 30,
      practical: 20,
      oral: 10,
      bonus: 10,
      penalties: 5,
    });
    expect(r.total).toBe(55);
  });

  it("jami 0 dan pastga tushmaydi", () => {
    const r = ended({ homework: 3, penalties: 10 });
    expect(r.total).toBe(0);
    expect(r.status).toBe("FAILED");
  });

  it("manfiy tuzatish ham 0 dan pastga tushirmaydi", () => {
    expect(ended({ homework: 2, adjustments: -5 }).total).toBe(0);
  });
});

describe("holat chegaralari", () => {
  it("o'tish bali 36", () => {
    expect(passScore(rules)).toBe(36);
  });

  it("9.5 → Yiqildi, EXTRA rad etiladi", () => {
    const r = ended({ homework: 9.5 });
    expect(r.status).toBe("FAILED");
    expect(r.canReceiveExtra).toBe(false);
  });

  it("10 → Qo'shimcha imkoniyat", () => {
    const r = ended({ homework: 10 });
    expect(r.status).toBe("EXTRA_CHANCE");
    expect(r.canReceiveExtra).toBe(true);
  });

  it("36 → O'tdi", () => {
    const r = ended({ homework: 30, oral: 6 });
    expect(r.total).toBe(36);
    expect(r.status).toBe("PASSED");
    expect(r.canReceiveExtra).toBe(false);
  });

  it("EXTRA'dan keyin qayta hisoblanadi; EXTRA'siz jami o'zgarmaydi", () => {
    const r = ended({ homework: 20, extra: 16 });
    expect(r.withoutExtra).toBe(20);
    expect(r.total).toBe(36);
    expect(r.status).toBe("PASSED");
    // Qo'yilgan EXTRA'ni tahrirlash mumkin bo'lib qoladi
    expect(r.canReceiveExtra).toBe(true);
  });

  it("EXTRA yetmasa — hali ham qo'shimcha imkoniyat", () => {
    expect(ended({ homework: 20, extra: 5 }).status).toBe("EXTRA_CHANCE");
  });

  it("jarima EXTRA'siz jamini 10 dan pastga tushirsa — yiqildi", () => {
    expect(ended({ homework: 12, penalties: 3 }).status).toBe("FAILED");
  });
});

describe("EXTRA vaqti", () => {
  it("semestr tugamaguncha EXTRA qo'yib bo'lmaydi", () => {
    const r = computeSemesterResult(rules, sums({ homework: 15 }), false);
    expect(r.status).toBe("IN_PROGRESS");
    expect(r.canReceiveExtra).toBe(false);
    expect(canReceiveExtra(rules, 15, false)).toBe(false);
    expect(canReceiveExtra(rules, 15, true)).toBe(true);
  });

  it("semestr yopilsa yoki oxirgi kuni o'tsa tugagan", () => {
    const s = { endDate: "2026-12-31", closed: false };
    expect(isSemesterEnded(s, "2026-12-31")).toBe(false);
    expect(isSemesterEnded(s, "2027-01-01")).toBe(true);
    expect(isSemesterEnded({ ...s, closed: true }, "2026-10-01")).toBe(true);
  });
});

describe("ball qiymatlari", () => {
  it("uyga vazifa: faqat 0, 0.5 va 1", () => {
    expect(isValidPoints("HOMEWORK", 0, 1)).toBe(true);
    expect(isValidPoints("HOMEWORK", 0.5, 1)).toBe(true);
    expect(isValidPoints("HOMEWORK", 1, 1)).toBe(true);
    expect(isValidPoints("HOMEWORK", 0.7, 1)).toBe(false);
    expect(isValidPoints("HOMEWORK", 2, 5)).toBe(false);
    expect(isValidPoints("HOMEWORK", -0.5, 1)).toBe(false);
    expect(isValidPoints("HOMEWORK", Number.NaN, 1)).toBe(false);
  });

  it("og'zaki: 0 / 0.5 / 1", () => {
    expect(isValidPoints("ORAL", 1, 0)).toBe(true);
    expect(isValidPoints("ORAL", 1.5, 0)).toBe(false);
  });

  it("amaliy: 0..maxPoints, 0.5 qadam", () => {
    expect(isValidPoints("PRACTICAL", 4.5, 5)).toBe(true);
    expect(isValidPoints("PRACTICAL", 5.5, 5)).toBe(false);
    expect(isValidPoints("PRACTICAL", 2.25, 5)).toBe(false);
  });
});

describe("formatlash", () => {
  it("vergul bilan, yig'ilgan / chegara", () => {
    expect(formatPoints(12.5)).toBe("12,5");
    expect(formatPoints(6.67)).toBe("6,7");
    expect(categoryText({ earned: 12.5, cap: 30, counted: 12.5 })).toBe(
      "12,5 / 30",
    );
    expect(categoryText({ earned: 3, cap: null, counted: 3 })).toBe("3");
  });
});

describe("rankByTotal", () => {
  it("jami ball kamayish bo'yicha, teng ballga bir xil o'rin (1, 1, 3)", () => {
    const ranked = rankByTotal([
      { fullName: "Vali", total: 30 },
      { fullName: "Ali", total: 42.5 },
      { fullName: "Bek", total: 30 },
      { fullName: "Dil", total: 12 },
    ]);
    expect(ranked.map((r) => [r.rank, r.fullName])).toEqual([
      [1, "Ali"],
      [2, "Bek"],
      [2, "Vali"],
      [4, "Dil"],
    ]);
  });

  it("bo'sh ro'yxat", () => {
    expect(rankByTotal([])).toEqual([]);
  });
});

describe("normativ va avtomatik jarimalar", () => {
  it("normativdan pastlar oxirida, o'rinlar uzluksiz", () => {
    const ranked = rankByTotal([
      { fullName: "Ali", total: 20, belowNorm: true },
      { fullName: "Bek", total: 40, belowNorm: false },
      { fullName: "Dil", total: 30, belowNorm: true },
      { fullName: "Eva", total: 36, belowNorm: false },
      { fullName: "Fot", total: 20, belowNorm: true },
    ]);
    expect(ranked.map((r) => [r.rank, r.fullName])).toEqual([
      [1, "Bek"],
      [2, "Eva"],
      [3, "Dil"],
      [4, "Ali"],
      [4, "Fot"],
    ]);
  });

  it("semestrning oxirgi 14 kuni (endDate kiradi)", () => {
    const s = { endDate: "2026-12-31" };
    expect(isFinalStretch(s, "2026-12-17")).toBe(false);
    expect(isFinalStretch(s, "2026-12-18")).toBe(true);
    expect(isFinalStretch(s, "2026-12-31")).toBe(true);
    expect(isFinalStretch(s, "2027-01-01")).toBe(false);
  });

  it("uyga vazifaga 0 — vazifaning jarimasi, sababsiz kelmaslik — −1, yangilari birinchi", () => {
    const list = autoPenalties({
      zeroHomework: [
        {
          assignmentId: "h1",
          title: "CSS",
          dueDate: "2026-10-05",
          missPenalty: 1,
        },
        {
          assignmentId: "h2",
          title: "JS",
          dueDate: "2026-10-16",
          missPenalty: 2,
        },
      ],
      absences: [{ lessonId: "l1", date: "2026-10-08" }],
    });
    expect(list.map((p) => [p.id, p.points, p.name, p.note])).toEqual([
      ["auto:hw:h2", 2, "Uyga vazifa bajarilmagan", "JS"],
      ["auto:abs:l1", 1, "Darsga sababsiz kelmadi", null],
      ["auto:hw:h1", 1, "Uyga vazifa bajarilmagan", "CSS"],
    ]);
  });
});
