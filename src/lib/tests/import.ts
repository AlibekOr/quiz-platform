import {
  issueMessages,
  MAX_OPTIONS,
  questionInputSchema,
  type QuestionInput,
} from "./schema";

// Sof funksiyalar: klientda preview, serverda yakuniy tekshiruv uchun

export const MAX_IMPORT_QUESTIONS = 500;
export const EXCEL_COLUMNS = [
  "text",
  "type",
  "points",
  "A",
  "B",
  "C",
  "D",
  "correct",
] as const;

export type ParsedQuestion = {
  /** JSON'da massiv indeksi + 1, Excel'da qator raqami */
  line: number;
  question: QuestionInput | null;
  /** Preview uchun xom ko'rinish */
  preview: {
    text: string;
    type: string;
    points: string;
    options: { text: string; isCorrect: boolean }[];
  };
  errors: string[];
};

export type ParseResult = { questions: ParsedQuestion[] } | { error: string };

function str(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function validate(
  line: number,
  raw: unknown,
  preview: ParsedQuestion["preview"],
): ParsedQuestion {
  const parsed = questionInputSchema.safeParse(raw);
  return parsed.success
    ? { line, question: parsed.data, preview, errors: [] }
    : { line, question: null, preview, errors: issueMessages(parsed.error) };
}

function normalizeType(value: unknown): unknown {
  return typeof value === "string" ? value.trim().toUpperCase() : value;
}

/** JSON: [{ text, type, points, options: [{ text, isCorrect }] }] */
export function parseJsonQuestions(source: string): ParseResult {
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    return { error: "JSON formati noto'g'ri" };
  }
  if (!Array.isArray(data))
    return {
      error: "JSON massiv bo'lishi kerak: [{ text, type, points, options }]",
    };
  if (data.length === 0) return { error: "Faylda savollar yo'q" };
  if (data.length > MAX_IMPORT_QUESTIONS) {
    return {
      error: `Bir martada ko'pi bilan ${MAX_IMPORT_QUESTIONS} ta savol import qilinadi`,
    };
  }

  const questions = data.map((item, i) => {
    const obj = (item && typeof item === "object" ? item : {}) as Record<
      string,
      unknown
    >;
    const options = Array.isArray(obj.options)
      ? obj.options.map((o) => {
          const opt = (o && typeof o === "object" ? o : {}) as Record<
            string,
            unknown
          >;
          return { text: str(opt.text), isCorrect: opt.isCorrect === true };
        })
      : [];
    const raw = {
      text: typeof obj.text === "string" ? obj.text : "",
      type: normalizeType(obj.type ?? "SINGLE"),
      points: obj.points ?? 1,
      options,
    };
    return validate(i + 1, raw, {
      text: str(obj.text),
      type: str(raw.type),
      points: str(raw.points),
      options,
    });
  });
  return { questions };
}

/**
 * Excel: text | type | points | A | B | C | D | correct (correct: "B" yoki "A,C").
 * A–J ustunlaridan bo'shlari tashlab yuboriladi. type bo'sh bo'lsa to'g'ri javoblar soniga qarab aniqlanadi.
 */
export function sheetToQuestions(
  sheet: readonly (readonly unknown[])[],
): ParseResult {
  if (sheet.length === 0) return { error: "Fayl bo'sh" };

  const header = sheet[0].map((c) => str(c).toLowerCase());
  const col = (name: string) => header.indexOf(name.toLowerCase());
  for (const required of ["text", "correct", "a", "b"]) {
    if (col(required) === -1) {
      return {
        error: `"${required}" ustuni topilmadi. Kerakli ustunlar: ${EXCEL_COLUMNS.join(" | ")}`,
      };
    }
  }
  const letters = "ABCDEFGHIJ".slice(0, MAX_OPTIONS).split("");
  const optionColumns = letters
    .map((l) => ({ letter: l, index: col(l) }))
    .filter((c) => c.index !== -1);

  const questions: ParsedQuestion[] = [];
  for (const [i, cells] of sheet.slice(1).entries()) {
    if (cells.every((c) => str(c) === "")) continue;
    if (questions.length >= MAX_IMPORT_QUESTIONS) {
      return {
        error: `Bir martada ko'pi bilan ${MAX_IMPORT_QUESTIONS} ta savol import qilinadi`,
      };
    }
    const line = i + 2;
    const errors: string[] = [];

    const correctLetters = str(cells[col("correct")])
      .toUpperCase()
      .split(/[\s,;]+/)
      .filter(Boolean);
    const present = optionColumns
      .map((c) => ({ letter: c.letter, text: str(cells[c.index]) }))
      .filter((o) => o.text !== "");
    for (const letter of correctLetters) {
      if (!present.some((o) => o.letter === letter))
        errors.push(`To'g'ri javob "${letter}" varianti bo'sh yoki yo'q`);
    }
    const options = present.map((o) => ({
      text: o.text,
      isCorrect: correctLetters.includes(o.letter),
    }));

    const typeCell =
      col("type") === -1 ? "" : str(cells[col("type")]).toUpperCase();
    const type =
      typeCell || (correctLetters.length > 1 ? "MULTIPLE" : "SINGLE");
    const pointsCell = col("points") === -1 ? "" : str(cells[col("points")]);
    const points = pointsCell === "" ? 1 : Number(pointsCell);
    const text = str(cells[col("text")]);

    const result = validate(
      line,
      { text, type, points, options },
      { text, type, points: pointsCell || "1", options },
    );
    if (errors.length > 0) {
      result.errors = [...errors, ...result.errors];
      result.question = null;
    }
    questions.push(result);
  }

  if (questions.length === 0) return { error: "Faylda savollar yo'q" };
  return { questions };
}
