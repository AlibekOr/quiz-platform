import { describe, expect, it } from "vitest";
import {
  activeGroupId,
  activeHref,
  flattenNav,
  groupBadge,
  isGroupOpen,
  parseOpenState,
  type NavItem,
} from "./nav";

const items: NavItem[] = [
  { href: "/teacher", label: "Bosh sahifa", exact: true },
  { href: "/teacher/groups", label: "Guruhlar" },
  {
    id: "attendance",
    label: "Davomat",
    children: [
      { href: "/teacher/attendance", label: "Davomat yuritish" },
      { href: "/teacher/attendance/report", label: "Davomat hisoboti" },
    ],
  },
  {
    id: "settings",
    label: "Sozlamalar",
    children: [
      { href: "/teacher/managers", label: "Menejerlar" },
      { href: "/teacher/requests", label: "So'rovlar" },
    ],
  },
];
const links = flattenNav(items);

describe("activeHref", () => {
  it("bosh sahifa faqat aynan o'z yo'lida faol", () => {
    expect(activeHref("/teacher", links)).toBe("/teacher");
    expect(activeHref("/teacher/unknown", links)).toBeNull();
  });

  it("ichki sahifa ota havolani faol qiladi", () => {
    expect(activeHref("/teacher/groups/abc", links)).toBe("/teacher/groups");
  });

  it("eng uzun mos havola tanlanadi", () => {
    expect(activeHref("/teacher/attendance/report", links)).toBe(
      "/teacher/attendance/report",
    );
    expect(activeHref("/teacher/attendance/g1/2026-10-01", links)).toBe(
      "/teacher/attendance",
    );
  });

  it("prefiks so'z o'rtasida mos kelmaydi", () => {
    expect(activeHref("/teacher/groupsx", links)).toBeNull();
  });
});

describe("activeGroupId", () => {
  it("faol havolaning guruhi", () => {
    expect(activeGroupId(items, "/teacher/attendance/report")).toBe(
      "attendance",
    );
    expect(activeGroupId(items, "/teacher/groups")).toBeNull();
    expect(activeGroupId(items, null)).toBeNull();
  });
});

describe("groupBadge", () => {
  it("bolalar badge'lari yig'iladi", () => {
    const settings = items[3];
    if (!("children" in settings)) throw new Error("guruh kutilgan");
    expect(groupBadge(settings, { "/teacher/requests": 3 })).toBe(3);
    expect(groupBadge(settings, {})).toBe(0);
  });
});

describe("parseOpenState", () => {
  it("to'g'ri JSON o'qiladi, boolean bo'lmaganlar tashlanadi", () => {
    expect(parseOpenState('{"a":true,"b":false,"c":1}')).toEqual({
      a: true,
      b: false,
    });
  });

  it("bo'sh yoki buzilgan qiymat — bo'sh holat", () => {
    expect(parseOpenState(null)).toEqual({});
    expect(parseOpenState("{oops")).toEqual({});
    expect(parseOpenState("[true]")).toEqual({});
  });
});

describe("isGroupOpen", () => {
  it("saqlangan holat ustun, aks holda faol guruh ochiq", () => {
    expect(isGroupOpen("attendance", {}, "attendance")).toBe(true);
    expect(isGroupOpen("settings", {}, "attendance")).toBe(false);
    expect(isGroupOpen("settings", { settings: true }, null)).toBe(true);
    expect(isGroupOpen("attendance", { attendance: false }, "attendance")).toBe(
      false,
    );
  });
});
