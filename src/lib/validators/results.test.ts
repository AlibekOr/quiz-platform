import { describe, expect, it } from "vitest";
import { resultsQuerySchema } from "./results";

describe("resultsQuerySchema", () => {
  it("standart qiymatlar", () => {
    expect(
      resultsQuerySchema.parse({ groupId: null, sort: null, dir: null }),
    ).toEqual({ groupId: null, sort: "first", dir: null });
  });

  it("to'g'ri qiymatlar o'tadi, noma'lumlari standartga tushadi", () => {
    expect(
      resultsQuerySchema.parse({ groupId: "g1", sort: "name", dir: "asc" }),
    ).toEqual({ groupId: "g1", sort: "name", dir: "asc" });
    expect(
      resultsQuerySchema.parse({
        groupId: "x".repeat(65),
        sort: "password",
        dir: "up",
      }),
    ).toEqual({ groupId: null, sort: "first", dir: null });
  });
});
