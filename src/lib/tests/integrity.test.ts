import { describe, expect, it } from "vitest";
import {
  integrityFlags,
  tabLeaveOutcome,
  usualPercent,
  type IntegrityInput,
} from "./integrity";

const base: IntegrityInput = {
  tabLeaves: 0,
  closedForLeaving: false,
  percent: 70,
  durationSec: 600,
  questionCount: 20,
  usualPercent: null,
};

const kinds = (input: Partial<IntegrityInput>) =>
  integrityFlags({ ...base, ...input }).map((f) => f.kind);

describe("tabLeaveOutcome", () => {
  it("closes on the third leave", () => {
    expect(tabLeaveOutcome(1)).toEqual({ close: false, remaining: 2 });
    expect(tabLeaveOutcome(2)).toEqual({ close: false, remaining: 1 });
    expect(tabLeaveOutcome(3)).toEqual({ close: true, remaining: 0 });
    expect(tabLeaveOutcome(5)).toEqual({ close: true, remaining: 0 });
  });
});

describe("integrityFlags", () => {
  it("is empty for a normal attempt", () => {
    expect(kinds({})).toEqual([]);
  });

  it("reports leaves, or closed instead of leaves", () => {
    expect(kinds({ tabLeaves: 2 })).toEqual(["leaves"]);
    expect(kinds({ tabLeaves: 3, closedForLeaving: true })).toEqual(["closed"]);
  });

  it("flags a high score done too fast", () => {
    expect(kinds({ percent: 95, durationSec: 150 })).toEqual(["fast"]);
    expect(kinds({ percent: 95, durationSec: 200 })).toEqual([]);
    expect(kinds({ percent: 80, durationSec: 60 })).toEqual([]);
    // Kam savolli testda tezlik tekshirilmaydi
    expect(kinds({ percent: 100, durationSec: 10, questionCount: 4 })).toEqual(
      [],
    );
  });

  it("flags a sharp jump over the usual percent", () => {
    expect(kinds({ percent: 90, usualPercent: 55 })).toEqual(["jump"]);
    expect(kinds({ percent: 80, usualPercent: 55 })).toEqual([]);
  });
});

describe("usualPercent", () => {
  it("needs at least three attempts", () => {
    expect(usualPercent([50, 60])).toBeNull();
    expect(usualPercent([50, 60, 71])).toBe(60);
  });
});
