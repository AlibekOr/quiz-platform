import "server-only";
import { cookies } from "next/headers";
import {
  decodeSession,
  encodeSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  type SessionPayload,
} from "./jwt";

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encodeSession(payload);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    // localhost'da http ishlashi uchun faqat prod'da
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  return decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
