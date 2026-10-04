import "server-only";
import { db } from "@/lib/db";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_FAILURES = 10;

function windowStart(): Date {
  return new Date(Date.now() - LOGIN_WINDOW_MS);
}

export async function isLoginLocked(username: string): Promise<boolean> {
  const failures = await db.loginFailure.count({
    where: { username, createdAt: { gte: windowStart() } },
  });
  return failures >= LOGIN_MAX_FAILURES;
}

export async function recordLoginFailure(username: string): Promise<void> {
  await db.$transaction([
    db.loginFailure.deleteMany({
      where: { username, createdAt: { lt: windowStart() } },
    }),
    db.loginFailure.create({ data: { username } }),
  ]);
}

export async function clearLoginFailures(username: string): Promise<void> {
  await db.loginFailure.deleteMany({ where: { username } });
}
