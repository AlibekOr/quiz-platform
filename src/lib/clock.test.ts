import { describe, expect, it } from "vitest";
import {
  formatTime,
  hourMarks,
  parseTime,
  pointToValue,
  valuePosition,
} from "./clock";

describe("soat siferblati", () => {
  it("24 soatning hammasi bir martadan", () => {
    const values = hourMarks().map((m) => m.value);
    expect([...values].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 24 }, (_, i) => i),
    );
  });

  it("tashqi halqa 1–12, ichki halqa 13–23 va 00", () => {
    expect(pointToValue("hour", 0, -1)).toBe(12);
    expect(pointToValue("hour", 0, -0.6)).toBe(0);
    expect(pointToValue("hour", 1, 0)).toBe(3);
    expect(pointToValue("hour", 0.6, 0)).toBe(15);
    expect(pointToValue("hour", 0, 0.95)).toBe(6);
    expect(pointToValue("hour", -0.55, 0)).toBe(21);
  });

  it("daqiqa qadamga yaxlitlanadi, 60 -> 00", () => {
    expect(pointToValue("minute", 1, 0)).toBe(15);
    expect(pointToValue("minute", 0, 1)).toBe(30);
    const rad = (358 * Math.PI) / 180;
    expect(pointToValue("minute", Math.sin(rad), -Math.cos(rad))).toBe(0);
    expect(pointToValue("minute", 1, 0.1, 1)).toBe(16);
  });

  it("qiymat o'rni va qayta o'qish mos keladi", () => {
    for (const hour of [0, 5, 12, 13, 23]) {
      const p = valuePosition("hour", hour);
      expect(pointToValue("hour", p.x, p.y)).toBe(hour);
    }
  });

  it("parseTime / formatTime", () => {
    expect(parseTime("09:05")).toEqual({ hour: 9, minute: 5 });
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("")).toBeNull();
    expect(formatTime(7, 0)).toBe("07:00");
  });
});
