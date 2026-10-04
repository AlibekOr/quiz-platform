import { describe, expect, it } from "vitest";
import { percent } from "./format";
import {
  addDays,
  datesBetween,
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatDuration,
  formatSchedule,
  fromDbDate,
  isValidDateStr,
  isValidMonthStr,
  monthRange,
  toDbDate,
  todayInTashkent,
  weekdayOf,
} from "./time";

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

describe("Toshkent sanalari", () => {
  it("todayInTashkent: UTC yarim tundan oldin ham Toshkentda ertangi kun bo'lishi mumkin", () => {
    expect(todayInTashkent(new Date("2026-10-04T18:59:59Z"))).toBe(
      "2026-10-04",
    );
    expect(todayInTashkent(new Date("2026-10-04T19:00:00Z"))).toBe(
      "2026-10-05",
    );
    expect(todayInTashkent(new Date("2026-12-31T20:00:00Z"))).toBe(
      "2027-01-01",
    );
  });

  it("weekdayOf: 1 = Dushanba, 7 = Yakshanba", () => {
    expect(weekdayOf("2026-10-05")).toBe(1);
    expect(weekdayOf("2026-10-04")).toBe(7);
    expect(weekdayOf("2026-10-07")).toBe(3);
  });

  it("monthRange, datesBetween, addDays", () => {
    expect(monthRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
    expect(monthRange("2028-02").to).toBe("2028-02-29");
    expect(monthRange("2026-12")).toEqual({
      from: "2026-12-01",
      to: "2026-12-31",
    });
    expect(datesBetween("2026-09-29", "2026-10-02")).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
    ]);
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("validatsiya va bazaga aylantirish", () => {
    expect(isValidDateStr("2026-02-29")).toBe(false);
    expect(isValidDateStr("2028-02-29")).toBe(true);
    expect(isValidDateStr("2026-1-5")).toBe(false);
    expect(isValidMonthStr("2026-13")).toBe(false);
    expect(fromDbDate(toDbDate("2026-10-04"))).toBe("2026-10-04");
  });

  it("formatlar", () => {
    expect(formatDayMonth("2026-10-04")).toBe("04.10");
    expect(formatDate("2026-10-04")).toBe("04.10.2026");
    expect(
      formatSchedule([
        { weekday: 5, startTime: "14:00", endTime: "16:00" },
        { weekday: 1, startTime: "14:00", endTime: "16:00" },
        { weekday: 3, startTime: "14:00", endTime: "16:00" },
      ]),
    ).toBe("Du, Cho, Ju · 14:00–16:00");
    expect(
      formatSchedule([
        { weekday: 2, startTime: "10:00", endTime: "12:00" },
        { weekday: 6, startTime: "09:00", endTime: "11:00" },
      ]),
    ).toBe("Se 10:00–12:00, Sha 09:00–11:00");
  });
});
