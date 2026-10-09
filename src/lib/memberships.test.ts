import { describe, expect, it } from "vitest";
import {
  departureLabel,
  describeDeparture,
  isMemberOn,
  latestMembershipDay,
  toPeriod,
} from "./memberships";

// Toshkent = UTC+5: 2026-10-09T19:00Z Toshkentda allaqachon 10.10
const at = (iso: string) => new Date(iso);

describe("toPeriod / isMemberOn", () => {
  it("sanalar Toshkent bo'yicha; chiqqan kun kirmaydi", () => {
    const p = toPeriod({
      joinedAt: at("2026-10-01T05:00:00Z"),
      leftAt: at("2026-10-09T19:00:00Z"),
    });
    expect(p).toEqual({ from: "2026-10-01", to: "2026-10-10" });
    expect(isMemberOn([p], "2026-09-30")).toBe(false);
    expect(isMemberOn([p], "2026-10-01")).toBe(true);
    expect(isMemberOn([p], "2026-10-09")).toBe(true);
    expect(isMemberOn([p], "2026-10-10")).toBe(false);
  });

  it("ochiq a'zolik va bir necha davr", () => {
    const periods = [
      { from: "2026-09-01", to: "2026-09-10" },
      { from: "2026-10-01", to: null },
    ];
    expect(isMemberOn(periods, "2026-09-15")).toBe(false);
    expect(isMemberOn(periods, "2027-01-01")).toBe(true);
    expect(isMemberOn([], "2026-10-01")).toBe(false);
  });
});

describe("describeDeparture", () => {
  const A = { groupId: "A", groupName: "Frontend-1" };
  const B = { groupId: "B", groupName: "Frontend-2" };

  it("hozir ham a'zo yoki umuman a'zo bo'lmagan — null", () => {
    expect(
      describeDeparture("A", [
        { ...A, joinedAt: at("2026-09-01T05:00:00Z"), leftAt: null },
      ]),
    ).toBeNull();
    expect(describeDeparture("A", [])).toBeNull();
  });

  it("shu kuni boshqa guruhga qo'shilgan — o'tkazilgan", () => {
    const d = describeDeparture("A", [
      {
        ...A,
        joinedAt: at("2026-09-01T05:00:00Z"),
        leftAt: at("2026-10-09T19:00:00Z"),
      },
      { ...B, joinedAt: at("2026-10-09T19:00:00Z"), leftAt: null },
    ]);
    expect(d).toEqual({
      kind: "moved",
      groupName: "Frontend-2",
      date: "2026-10-10",
    });
    expect(departureLabel(d!)).toBe("o'tkazilgan: Frontend-2, 10.10.2026");
  });

  it("boshqa guruhga qo'shilmagan — chiqarilgan; oxirgi davr hisobga olinadi", () => {
    const d = describeDeparture("A", [
      {
        ...A,
        joinedAt: at("2026-08-01T05:00:00Z"),
        leftAt: at("2026-08-10T05:00:00Z"),
      },
      {
        ...B,
        joinedAt: at("2026-08-10T05:00:00Z"),
        leftAt: at("2026-09-01T05:00:00Z"),
      },
      {
        ...A,
        joinedAt: at("2026-09-01T05:00:00Z"),
        leftAt: at("2026-10-05T10:00:00Z"),
      },
    ]);
    expect(d).toEqual({ kind: "removed", date: "2026-10-05" });
    expect(departureLabel(d!)).toBe("guruhdan chiqarilgan, 05.10.2026");
  });
});

describe("latestMembershipDay", () => {
  it("qo'shilish va chiqish kunlarining eng so'nggisi (Toshkent)", () => {
    expect(latestMembershipDay([])).toBeNull();
    expect(
      latestMembershipDay([
        {
          joinedAt: at("2026-09-01T05:00:00Z"),
          leftAt: at("2026-10-09T19:00:00Z"),
        },
        { joinedAt: at("2026-10-03T05:00:00Z"), leftAt: null },
      ]),
    ).toBe("2026-10-10");
    expect(
      latestMembershipDay([
        { joinedAt: at("2026-10-03T05:00:00Z"), leftAt: null },
      ]),
    ).toBe("2026-10-03");
  });
});
