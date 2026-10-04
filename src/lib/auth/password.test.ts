import { describe, expect, it } from "vitest";
import { hashPassword, verifyAgainstDummy, verifyPassword } from "./password";

describe("password", () => {
  it("hash ochiq parolni o'z ichiga olmaydi va har safar har xil bo'ladi", async () => {
    const a = await hashPassword("secret123");
    const b = await hashPassword("secret123");
    expect(a).not.toContain("secret123");
    expect(a).not.toBe(b);
  });

  it("to'g'ri parolni tasdiqlaydi", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("noto'g'ri parolni rad etadi", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("Secret123", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("dummy tekshiruv doim false qaytaradi", async () => {
    expect(await verifyAgainstDummy("dummy-password")).toBe(false);
  });
});
