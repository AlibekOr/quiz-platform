import { describe, expect, it } from "vitest";
import {
  firstInitial,
  groupCode,
  initialOf,
  personInitials,
} from "./group-code";

describe("initialOf", () => {
  it("Sh va Ch — bitta harf", () => {
    expect(initialOf("Shomanay")).toBe("SH");
    expect(initialOf("Chimboy")).toBe("CH");
    expect(initialOf("shahar")).toBe("SH");
  });

  it("boshqa harflar — bitta", () => {
    expect(initialOf("Xojeli")).toBe("X");
    expect(initialOf("Nukus")).toBe("N");
    expect(initialOf("Samarqand")).toBe("S");
  });

  it("apostrof tashlanadi: O' → O, G' → G", () => {
    expect(initialOf("O'zbekiston")).toBe("O");
    expect(initialOf("G'ijduvon")).toBe("G");
    expect(initialOf("Oʻzbekiston")).toBe("O");
    expect(initialOf("G‘allaorol")).toBe("G");
  });

  it("boshidagi belgilar o'tkaziladi, raqam qoladi", () => {
    expect(initialOf("(Frontend)")).toBe("F");
    expect(initialOf("135")).toBe("1");
    expect(initialOf("—")).toBe("");
  });
});

describe("firstInitial va personInitials", () => {
  it("birinchi so'z", () => {
    expect(firstInitial("Shomanay 135 16:00")).toBe("SH");
    expect(firstInitial("  Frontend-1 ")).toBe("F");
    expect(firstInitial("")).toBe("");
  });

  it("familiya + ism, otasining ismi kirmaydi", () => {
    expect(personInitials("Orakbaev Alibek")).toBe("OA");
    expect(personInitials("Orakbaev Alibek Sagindikovich")).toBe("OA");
    expect(personInitials("Chorshanbiyev Shoxrux")).toBe("CHSH");
    expect(personInitials("Alibek")).toBe("A");
  });
});

describe("groupCode", () => {
  it("foydalanuvchi misollari", () => {
    expect(
      groupCode({
        regionName: "Shomanay",
        teacherFullName: "Orakbaev Alibek",
        seq: 1,
        groupName: "Shomanay 135 16:00",
      }),
    ).toBe("SHOA-1-SH");
    expect(
      groupCode({
        regionName: "Xojeli",
        teacherFullName: "Orakbaev Alibek",
        seq: 3,
        groupName: "Xojeli 246 14:00",
      }),
    ).toBe("XOA-3-X");
    expect(
      groupCode({
        regionName: "Shomanay tumani",
        teacherFullName: "Orakbaev Alibek",
        seq: 4,
        groupName: "O'zbek tili",
      }),
    ).toBe("SHOA-4-O");
  });
});
