import { describe, expect, it } from "vitest";
import {
  canReceiveExtra,
  categoryText,
  computeSemesterResult,
  DEFAULT_TEMPLATE,
  formatPoints,
  autoPenalties,
  isFinalStretch,
  isSemesterEnded,
  isValidPoints,
  passScore,
  pointChoices,
  rankByTotal,
  rulesOf,
  type SemesterRules,
} from "./grades";

// Standart shablon (ROLES.md §5) = eski tizim: 60 / 36 / 10, 30/20/10/40, qo'shimcha —
// semestr tugagach [10, 36) oralig'idagilarga, jami 60 dan oshmaydi.
// rulesOf id'lari: c0 uyga vazifa, c1 amaliy, c2 og'zaki, c3 qo'shimcha, c4 bonus
const rules = rulesOf(DEFAULT_TEMPLATE);

type Points = Partial<
  Record<"homework" | "practical" | "oral" | "extra" | "bonus", number>
> & { adjustments?: number; penalties?: number };

function result(r: SemesterRules, p: Points, ended = true) {
  return computeSemesterResult(
    r,
    {
      byCategory: {
        c0: p.homework ?? 0,
        c1: p.practical ?? 0,
        c2: p.oral ?? 0,
        c3: p.extra ?? 0,
        c4: p.bonus ?? 0,
      },
      adjustments: p.adjustments ?? 0,
      penalties: p.penalties ?? 0,
    },
    ended,
  );
}
const ended = (p: Points) => result(rules, p);

/** 2026-11-06 dagi qoidalar (hozirgi o'qituvchining shabloni): qo'shimcha chegarasiz, hammaga */
const current: SemesterRules = {
  ...rules,
  extraMode: "ANYTIME",
  extraBeyondMax: true,
  categories: rules.categories.map((c) =>
    c.kind === "EXTRA" ? { ...c, cap: null } : c,
  ),
};

describe("standart shablon = eski tizim", () => {
  it("o'tish bali 36, kategoriya chegaralari 30 / 20 / 10 / 40, bonus chegarasiz", () => {
    expect(passScore(rules)).toBe(36);
    const r = result(
      { ...rules, maxTotal: 1000 },
      { homework: 45, practical: 33, oral: 12.5, extra: 50, bonus: 7 },
    );
    const counted = Object.fromEntries(
      r.categories.map((c) => [c.kind, c.counted]),
    );
    expect(counted).toEqual({
      HOMEWORK: 30,
      PRACTICAL: 20,
      ORAL: 10,
      EXTRA: 40,
      BONUS: 7,
    });
    expect(r.categories[0]).toMatchObject({
      name: "Uyga vazifa",
      earned: 45,
      cap: 30,
    });
  });

  it("jami 60 dan oshmaydi — bonus, tuzatish va EXTRA bilan ham", () => {
    expect(
      ended({
        homework: 30,
        practical: 20,
        oral: 10,
        bonus: 15,
        adjustments: 5,
      }).total,
    ).toBe(60);
    expect(ended({ homework: 30, practical: 20, extra: 40 }).total).toBe(60);
  });

  it("jarimalar 60 lik chegaradan keyin ayiriladi, 0 dan pastga tushmaydi", () => {
    // 70 -> 60, keyin −5 = 55
    expect(
      ended({ homework: 30, practical: 20, oral: 10, bonus: 10, penalties: 5 })
        .total,
    ).toBe(55);
    expect(ended({ homework: 3, penalties: 10 }).total).toBe(0);
    expect(ended({ homework: 2, adjustments: -5 }).total).toBe(0);
  });

  it("holatlar: 9.5 yiqildi, 10 qo'shimcha imkoniyat, 36 o'tdi; EXTRA'dan keyin qayta", () => {
    expect(ended({ homework: 9.5 })).toMatchObject({
      status: "FAILED",
      canReceiveExtra: false,
    });
    expect(ended({ homework: 10 })).toMatchObject({
      status: "EXTRA_CHANCE",
      canReceiveExtra: true,
    });
    expect(ended({ homework: 30, oral: 6 })).toMatchObject({
      total: 36,
      status: "PASSED",
      canReceiveExtra: false,
    });
    const r = ended({ homework: 20, extra: 16 });
    expect(r).toMatchObject({ withoutExtra: 20, total: 36, status: "PASSED" });
    // Qo'yilgan EXTRA'ni tahrirlash mumkin bo'lib qoladi
    expect(r.canReceiveExtra).toBe(true);
    expect(ended({ homework: 20, extra: 5 }).status).toBe("EXTRA_CHANCE");
    expect(ended({ homework: 12, penalties: 3 }).status).toBe("FAILED");
  });

  it("semestr tugamaguncha EXTRA qo'yib bo'lmaydi", () => {
    const r = result(rules, { homework: 15 }, false);
    expect(r).toMatchObject({ status: "IN_PROGRESS", canReceiveExtra: false });
    expect(canReceiveExtra(rules, 15, false)).toBe(false);
    expect(canReceiveExtra(rules, 15, true)).toBe(true);
  });
});

describe("hozirgi o'qituvchi qoidalari (ANYTIME, 60 dan oshadi)", () => {
  it("60 dan faqat EXTRA hisobiga oshadi", () => {
    expect(
      result(current, {
        homework: 30,
        practical: 20,
        oral: 10,
        bonus: 15,
        adjustments: 5,
      }).total,
    ).toBe(60);
    const r = result(current, {
      homework: 30,
      practical: 20,
      oral: 10,
      bonus: 5,
      extra: 12,
    });
    expect(r).toMatchObject({ withoutExtra: 60, earned: 72, total: 72 });
    // 50 + 20 bonus -> 60, +10 EXTRA = 70, −4 = 66
    expect(
      result(current, {
        homework: 30,
        practical: 20,
        bonus: 20,
        extra: 10,
        penalties: 4,
      }).total,
    ).toBe(66);
  });

  it("qo'shimcha ball chegarasiz, hammaga, istalgan vaqtda", () => {
    const r = result(current, { homework: 5, extra: 31 }, true);
    expect(r).toMatchObject({ total: 36, status: "PASSED" });
    const running = result(
      current,
      { homework: 30, practical: 20, oral: 10, extra: 8 },
      false,
    );
    expect(running).toMatchObject({
      status: "IN_PROGRESS",
      total: 68,
      canReceiveExtra: true,
    });
    expect(canReceiveExtra(current, 2, false)).toBe(true);
  });
});

describe("o'qituvchi kategoriyalari", () => {
  it("o'zi nomlagan topshiriq kategoriyalari ham jamiga kiradi, chegarasi bilan", () => {
    const custom: SemesterRules = {
      maxTotal: 100,
      passPercent: 50,
      failBelow: 20,
      extraMode: "AFTER_END_BAND",
      extraBeyondMax: false,
      categories: [
        {
          id: "p",
          name: "Loyiha",
          kind: "ASSIGNMENT",
          cap: 40,
          itemMin: 0,
          itemMax: 40,
          step: 1,
        },
        {
          id: "n",
          name: "Nazorat",
          kind: "ASSIGNMENT",
          cap: null,
          itemMin: 0,
          itemMax: 30,
          step: 0.5,
        },
      ],
    };
    const r = computeSemesterResult(
      custom,
      { byCategory: { p: 45, n: 12.5 }, adjustments: 0, penalties: 0 },
      true,
    );
    expect(r.categories.map((c) => [c.name, c.counted])).toEqual([
      ["Loyiha", 40],
      ["Nazorat", 12.5],
    ]);
    expect(r).toMatchObject({ total: 52.5, passScore: 50, status: "PASSED" });
  });
});

describe("semestr tugashi", () => {
  it("yopilsa yoki oxirgi kuni o'tsa tugagan", () => {
    const sem = { endDate: "2026-12-31", closed: false };
    expect(isSemesterEnded(sem, "2026-12-31")).toBe(false);
    expect(isSemesterEnded(sem, "2027-01-01")).toBe(true);
    expect(isSemesterEnded({ ...sem, closed: true }, "2026-10-01")).toBe(true);
  });
});

describe("ball qiymatlari", () => {
  const [homework, practical, oral] = rules.categories;

  it("uyga vazifa: faqat 0, 0.5 va 1", () => {
    for (const p of [0, 0.5, 1])
      expect(isValidPoints(homework, p, 1)).toBe(true);
    for (const p of [0.7, 2, -0.5, Number.NaN])
      expect(isValidPoints(homework, p, 5)).toBe(false);
  });

  it("og'zaki: 0 / 0.5 / 1", () => {
    expect(isValidPoints(oral, 1, 0)).toBe(true);
    expect(isValidPoints(oral, 1.5, 0)).toBe(false);
  });

  it("amaliy: 0..maxPoints, 0.5 qadam", () => {
    expect(isValidPoints(practical, 4.5, 5)).toBe(true);
    expect(isValidPoints(practical, 5.5, 5)).toBe(false);
    expect(isValidPoints(practical, 2.25, 5)).toBe(false);
  });

  it("o'qituvchi oralig'i va qadami: 2..10, qadam 1", () => {
    const rule = {
      kind: "ASSIGNMENT" as const,
      itemMin: 2,
      itemMax: 10,
      step: 1,
    };
    expect(isValidPoints(rule, 2, 10)).toBe(true);
    expect(isValidPoints(rule, 1, 10)).toBe(false);
    expect(isValidPoints(rule, 2.5, 10)).toBe(false);
    expect(isValidPoints(rule, 9, 8)).toBe(false);
  });

  it("tugmalar: 5 tagacha qiymat, aks holda son maydoni", () => {
    expect(pointChoices(homework)).toEqual([0, 0.5, 1]);
    expect(pointChoices(practical, 2)).toEqual([0, 0.5, 1, 1.5, 2]);
    expect(pointChoices(practical, 20)).toBeNull();
  });
});

describe("formatlash", () => {
  it("vergul bilan, yig'ilgan / chegara", () => {
    expect(formatPoints(12.5)).toBe("12,5");
    expect(formatPoints(6.67)).toBe("6,7");
    expect(categoryText({ earned: 12.5, cap: 30 })).toBe("12,5 / 30");
    expect(categoryText({ earned: 3, cap: null })).toBe("3");
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
