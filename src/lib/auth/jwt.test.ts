import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  decodeSession,
  encodeSession,
  homePathFor,
  SESSION_MAX_AGE_SEC,
} from "./jwt";

const SECRET = "test-secret-test-secret-test-secret-123";

describe("jwt session", () => {
  beforeEach(() => vi.stubEnv("JWT_SECRET", SECRET));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("yaratilgan tokenni o'qiydi", async () => {
    const token = await encodeSession({
      userId: "u1",
      role: "STUDENT",
      groupId: "g1",
    });
    expect(await decodeSession(token)).toEqual({
      userId: "u1",
      role: "STUDENT",
      groupId: "g1",
    });
  });

  it("groupId bo'lmasa null qaytaradi", async () => {
    const token = await encodeSession({
      userId: "t1",
      role: "TEACHER",
      groupId: null,
    });
    expect(await decodeSession(token)).toEqual({
      userId: "t1",
      role: "TEACHER",
      groupId: null,
    });
  });

  it("token yo'q yoki buzilgan bo'lsa null", async () => {
    expect(await decodeSession(undefined)).toBeNull();
    expect(await decodeSession("not-a-jwt")).toBeNull();

    const token = await encodeSession({
      userId: "u1",
      role: "STUDENT",
      groupId: "g1",
    });
    const [header, payload, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({
        ...JSON.parse(Buffer.from(payload, "base64url").toString()),
        role: "TEACHER",
      }),
    ).toString("base64url");
    expect(await decodeSession(`${header}.${forged}.${signature}`)).toBeNull();
  });

  it("boshqa kalit bilan imzolangan tokenni rad etadi", async () => {
    const token = await new SignJWT({ role: "TEACHER", groupId: null })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("another-secret-another-secret-12345"));
    expect(await decodeSession(token)).toBeNull();
  });

  it("noma'lum rolni rad etadi", async () => {
    const token = await new SignJWT({ role: "ADMIN", groupId: null })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    expect(await decodeSession(token)).toBeNull();
  });

  it("7 kundan keyin muddati o'tadi", async () => {
    vi.useFakeTimers();
    const token = await encodeSession({
      userId: "u1",
      role: "STUDENT",
      groupId: "g1",
    });
    vi.advanceTimersByTime((SESSION_MAX_AGE_SEC - 60) * 1000);
    expect(await decodeSession(token)).not.toBeNull();
    vi.advanceTimersByTime(120 * 1000);
    expect(await decodeSession(token)).toBeNull();
  });

  it("JWT_SECRET qisqa bo'lsa xato beradi", async () => {
    vi.stubEnv("JWT_SECRET", "short");
    await expect(
      encodeSession({ userId: "u1", role: "STUDENT", groupId: null }),
    ).rejects.toThrow("JWT_SECRET");
  });

  it("rol bo'yicha bosh sahifa", () => {
    expect(homePathFor("TEACHER")).toBe("/teacher");
    expect(homePathFor("STUDENT")).toBe("/dashboard");
  });
});
