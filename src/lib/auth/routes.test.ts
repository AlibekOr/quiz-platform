import { describe, expect, it } from "vitest";
import { allowedRoles } from "./routes";

describe("allowedRoles", () => {
  it("har rol o'z bo'limiga", () => {
    expect(allowedRoles("/teacher")).toEqual(["TEACHER"]);
    expect(allowedRoles("/teacher/students/1")).toEqual(["TEACHER"]);
    expect(allowedRoles("/manager/requests")).toEqual(["MANAGER"]);
    expect(allowedRoles("/dashboard")).toEqual(["STUDENT"]);
    expect(allowedRoles("/test/abc")).toEqual(["STUDENT"]);
    expect(allowedRoles("/result/abc")).toEqual(["STUDENT"]);
    expect(allowedRoles("/grades")).toEqual(["STUDENT"]);
  });

  it("reyting hamma rolga (menejer doirasi server tomonda)", () => {
    expect(allowedRoles("/leaderboard")).toEqual([
      "TEACHER",
      "MANAGER",
      "STUDENT",
    ]);
    expect(allowedRoles("/test/abc/leaderboard")).toEqual([
      "TEACHER",
      "MANAGER",
      "STUDENT",
    ]);
  });

  it("o'xshash prefikslar va ochiq sahifalar", () => {
    expect(allowedRoles("/teachers")).toBeNull();
    expect(allowedRoles("/managerial")).toBeNull();
    expect(allowedRoles("/login")).toBeNull();
    expect(allowedRoles("/")).toBeNull();
  });
});
