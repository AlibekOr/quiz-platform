import { describe, expect, it } from "vitest";
import { leaderboardQuerySchema } from "./leaderboard";

describe("leaderboardQuerySchema", () => {
  it("standart qiymatlar: scope=group, id'lar null", () => {
    expect(
      leaderboardQuerySchema.parse({
        testId: null,
        scope: null,
        groupId: null,
      }),
    ).toEqual({ testId: null, scope: "group", groupId: null });
  });

  it("scope=all qabul qilinadi, noma'lum scope group'ga tushadi", () => {
    expect(leaderboardQuerySchema.parse({ scope: "all" }).scope).toBe("all");
    expect(leaderboardQuerySchema.parse({ scope: "everyone" }).scope).toBe(
      "group",
    );
  });

  it("bo'sh yoki juda uzun id rad etiladi (null)", () => {
    const q = leaderboardQuerySchema.parse({
      testId: "   ",
      groupId: "x".repeat(65),
    });
    expect(q.testId).toBeNull();
    expect(q.groupId).toBeNull();
  });
});
