import { describe, expect, it } from "vitest";
import {
  correctRate,
  findDuplicates,
  normalizeText,
  pickQuestions,
  pickReplacement,
  questionFingerprint,
  topicTree,
  topicWithDescendants,
  type BankItem,
  type QuestionShape,
} from "./bank";

/** Takrorlanadigan "tasodif": testlar barqaror bo'lsin */
function rng(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const q = (
  text: string,
  options: [string, boolean][],
  type: QuestionShape["type"] = "SINGLE",
): QuestionShape => ({
  text,
  type,
  options: options.map(([t, isCorrect]) => ({ text: t, isCorrect })),
});

describe("takroriy savollar", () => {
  const flex = q("display: flex nima qiladi?", [
    ["Flex konteyner", true],
    ["Grid", false],
  ]);

  it("matn bo'shliqlari, katta-kichik harf va variantlar tartibi farq qilmaydi", () => {
    const same = q("  Display:  FLEX nima qiladi? ", [
      ["Grid", false],
      ["flex konteyner", true],
    ]);
    expect(questionFingerprint(same)).toBe(questionFingerprint(flex));
    expect(normalizeText("O‘zbek  tili")).toBe("o'zbek tili");
  });

  it("to'g'ri javob, variant yoki tur boshqa bo'lsa — boshqa savol", () => {
    const fp = questionFingerprint(flex);
    expect(
      questionFingerprint(
        q("display: flex nima qiladi?", [
          ["Flex konteyner", false],
          ["Grid", true],
        ]),
      ),
    ).not.toBe(fp);
    expect(
      questionFingerprint(
        q("display: flex nima qiladi?", [
          ["Flex konteyner", true],
          ["Block", false],
        ]),
      ),
    ).not.toBe(fp);
    expect(questionFingerprint({ ...flex, type: "MULTIPLE" })).not.toBe(fp);
  });

  it("bankdagi va ro'yxat ichidagi takroriylar topiladi", () => {
    const grid = q("Grid nima?", [["Panjara", true]]);
    expect(findDuplicates([grid, flex, grid], [flex])).toEqual([1, 2]);
    expect(findDuplicates([grid], [])).toEqual([]);
  });
});

describe("mavzular daraxti", () => {
  const topics = [
    { id: "css", parentId: null },
    { id: "flex", parentId: "css" },
    { id: "grid", parentId: "css" },
    { id: "grid-areas", parentId: "grid" },
    { id: "js", parentId: null },
  ];

  it("ichki mavzular ham kiradi", () => {
    expect(topicWithDescendants(topics, "css").sort()).toEqual([
      "css",
      "flex",
      "grid",
      "grid-areas",
    ]);
    expect(topicWithDescendants(topics, "js")).toEqual(["js"]);
  });

  it("sikl bo'lsa ham to'xtaydi", () => {
    const loop = [
      { id: "a", parentId: "b" },
      { id: "b", parentId: "a" },
    ];
    expect(topicWithDescendants(loop, "a").sort()).toEqual(["a", "b"]);
  });

  it("topicTree: yo'l, chuqurlik va daraxt tartibi", () => {
    const named = [
      { id: "js", parentId: null, name: "JS" },
      { id: "grid", parentId: "css", name: "Grid" },
      { id: "css", parentId: null, name: "CSS" },
      { id: "flex", parentId: "css", name: "Flexbox" },
      { id: "lost", parentId: "deleted", name: "Yetim" },
    ];
    expect(topicTree(named).map((t) => [t.path, t.depth])).toEqual([
      ["CSS", 0],
      ["CSS / Flexbox", 1],
      ["CSS / Grid", 1],
      ["JS", 0],
      ["Yetim", 0],
    ]);
  });
});

describe("avtomatik yig'ish", () => {
  const pool: BankItem[] = [
    ...["f1", "f2", "f3", "f4", "f5", "f6"].map((id) => ({
      id,
      topicId: "flex",
      difficulty: "MEDIUM" as const,
      archived: false,
    })),
    { id: "f-easy", topicId: "flex", difficulty: "EASY", archived: false },
    { id: "f-old", topicId: "flex", difficulty: "MEDIUM", archived: true },
    ...["g1", "g2"].map((id) => ({
      id,
      topicId: "grid",
      difficulty: "EASY" as const,
      archived: false,
    })),
  ];
  const flexMedium = {
    topicIds: ["flex"],
    difficulty: "MEDIUM" as const,
    count: 5,
  };

  it("soni va filtrlar bo'yicha; arxivlangan olinmaydi", () => {
    const r = pickQuestions(pool, [flexMedium], { random: rng() });
    expect(r.picked[0]).toHaveLength(5);
    expect(r.picked[0].every((id) => /^f\d$/.test(id))).toBe(true);
    expect(r.shortages).toEqual([]);
  });

  it("yetmasa — nechtasi kamligi", () => {
    const r = pickQuestions(
      pool,
      [{ topicIds: ["grid"], difficulty: "EASY", count: 3 }],
      { random: rng() },
    );
    expect(r.picked[0].sort()).toEqual(["g1", "g2"]);
    expect(r.shortages).toEqual([{ rule: 0, missing: 1 }]);
  });

  it("bitta savol ikki qoidaga tushmaydi", () => {
    const r = pickQuestions(
      pool,
      [
        { topicIds: ["flex"], difficulty: null, count: 4 },
        { topicIds: ["flex"], difficulty: null, count: 4 },
      ],
      { random: rng(7) },
    );
    const all = r.picked.flat();
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(7); // 7 ta faol flex savol
    expect(r.shortages).toEqual([{ rule: 1, missing: 1 }]);
  });

  it("oldin ishlatilganlar chiqariladi", () => {
    const used = new Set(["f1", "f2", "f3"]);
    const r = pickQuestions(pool, [flexMedium], {
      exclude: used,
      random: rng(),
    });
    expect(r.picked[0].sort()).toEqual(["f4", "f5", "f6"]);
    expect(r.shortages).toEqual([{ rule: 0, missing: 2 }]);
  });

  it("boshqasini tanlash: tanlanmagan mos savol yoki null", () => {
    const selected = ["f1", "f2", "f3", "f4", "f5"];
    expect(pickReplacement(pool, flexMedium, selected, { random: rng() })).toBe(
      "f6",
    );
    expect(
      pickReplacement(pool, flexMedium, [...selected, "f6"], {
        random: rng(),
      }),
    ).toBeNull();
  });
});

describe("savol statistikasi", () => {
  it("10 ta urinishdan kam — ko'rsatilmaydi", () => {
    expect(correctRate({ attempts: 9, correct: 9 })).toBeNull();
    expect(correctRate({ attempts: 10, correct: 7 })).toBe(70);
    expect(correctRate({ attempts: 30, correct: 10 })).toBe(33);
  });
});
