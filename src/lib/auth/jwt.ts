import { jwtVerify, SignJWT } from "jose";

// proxy.ts va session.ts ikkalasi ishlatadi, shuning uchun next/headers va server-only yo'q

export type Role = "TEACHER" | "STUDENT";

export type SessionPayload = {
  userId: string;
  role: Role;
  groupId: string | null;
};

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60;

function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET kamida 32 belgidan iborat bo'lishi kerak");
  }
  return new TextEncoder().encode(secret);
}

export async function encodeSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, groupId: payload.groupId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getKey());
}

export async function decodeSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });
    const { sub, role, groupId } = payload;
    if (typeof sub !== "string" || (role !== "TEACHER" && role !== "STUDENT"))
      return null;
    return {
      userId: sub,
      role,
      groupId: typeof groupId === "string" ? groupId : null,
    };
  } catch {
    return null;
  }
}

export function homePathFor(role: Role): string {
  return role === "TEACHER" ? "/teacher" : "/dashboard";
}
