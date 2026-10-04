import { describe, expect, it } from "vitest";
import { percent } from "./format";
import { formatDateTime, formatDuration } from "./time";

describe("time", () => {
  it("formatDuration", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(125)).toBe("2:05");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(-5)).toBe("0:00");
  });

  it("formatDateTime Toshkent vaqtida (UTC+5)", () => {
    expect(formatDateTime(new Date("2026-10-04T21:30:00Z"))).toBe(
      "05.10.2026, 02:30",
    );
    expect(formatDateTime(new Date("2026-10-04T09:05:00Z"))).toBe(
      "04.10.2026, 14:05",
    );
  });
});

describe("percent", () => {
  it("yaxlitlaydi va 0 ga bo'lmaydi", () => {
    expect(percent(8, 10)).toBe(80);
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBe(0);
  });
});
