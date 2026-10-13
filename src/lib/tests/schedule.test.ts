import { describe, expect, it } from "vitest";
import { attemptDeadline, formatTestWindow, testState } from "./schedule";

const at = (s: string) => new Date(`${s}:00+05:00`);

describe("testState", () => {
  const window = {
    isActive: true,
    startsAt: at("2026-10-18T10:00"),
    endsAt: at("2026-10-18T11:00"),
  };

  it("o'chiq test har doim qoralama", () => {
    expect(
      testState({ ...window, isActive: false }, at("2026-10-18T10:30")),
    ).toBe("draft");
  });

  it("oraliq chegaralari: boshi kiradi, oxiri kirmaydi", () => {
    expect(testState(window, at("2026-10-18T09:59"))).toBe("upcoming");
    expect(testState(window, at("2026-10-18T10:00"))).toBe("open");
    expect(testState(window, at("2026-10-18T10:59"))).toBe("open");
    expect(testState(window, at("2026-10-18T11:00"))).toBe("closed");
  });

  it("vaqt berilmasa — faqat isActive", () => {
    const now = at("2026-10-18T10:30");
    expect(
      testState({ isActive: true, startsAt: null, endsAt: null }, now),
    ).toBe("open");
    expect(
      testState(
        { isActive: true, startsAt: null, endsAt: at("2026-10-18T10:00") },
        now,
      ),
    ).toBe("closed");
  });
});

describe("attemptDeadline", () => {
  it("davomiylik bo'yicha, yopilish bo'lmasa", () => {
    expect(attemptDeadline(at("2026-10-18T10:00"), 30, null)).toEqual(
      at("2026-10-18T10:30"),
    );
  });

  it("kech boshlagan o'quvchi yopilish vaqtida tugatadi", () => {
    expect(
      attemptDeadline(at("2026-10-18T10:50"), 30, at("2026-10-18T11:00")),
    ).toEqual(at("2026-10-18T11:00"));
    expect(
      attemptDeadline(at("2026-10-18T10:00"), 30, at("2026-10-18T11:00")),
    ).toEqual(at("2026-10-18T10:30"));
  });
});

describe("formatTestWindow", () => {
  const now = at("2026-10-13T09:00");

  it("bir kunlik oraliq", () => {
    expect(
      formatTestWindow(
        { startsAt: at("2026-10-18T10:00"), endsAt: at("2026-10-18T11:00") },
        now,
      ),
    ).toBe("Yakshanba, 18.10 · 10:00 – 11:00");
  });

  it("bir necha kunlik va bitta chegarali", () => {
    expect(
      formatTestWindow(
        { startsAt: at("2026-10-13T10:00"), endsAt: at("2026-10-15T18:00") },
        now,
      ),
    ).toBe("10:00 – Payshanba, 15.10 · 18:00");
    expect(
      formatTestWindow({ startsAt: null, endsAt: at("2026-10-13T18:00") }, now),
    ).toBe("18:00 gacha");
    expect(
      formatTestWindow({ startsAt: at("2026-10-13T18:00"), endsAt: null }, now),
    ).toBe("18:00 dan");
    expect(formatTestWindow({ startsAt: null, endsAt: null }, now)).toBeNull();
  });
});
