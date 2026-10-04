"use server";

import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { db } from "@/lib/db";
import { homePathFor } from "./jwt";
import { verifyAgainstDummy, verifyPassword } from "./password";
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "./rate-limit";
import { createSession, deleteSession } from "./session";

const INVALID_CREDENTIALS = "Login yoki parol noto'g'ri";

export async function login(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: INVALID_CREDENTIALS };
  const { username, password } = parsed.data;

  if (await isLoginLocked(username)) {
    return {
      ok: false,
      error:
        "Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urinib ko'ring",
    };
  }

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      passwordHash: true,
      role: true,
      groupId: true,
      isActive: true,
    },
  });
  const passwordOk = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyAgainstDummy(password);

  if (!user || !passwordOk) {
    await recordLoginFailure(username);
    return { ok: false, error: INVALID_CREDENTIALS };
  }
  if (!user.isActive) {
    return { ok: false, error: INVALID_CREDENTIALS };
  }

  await clearLoginFailures(username);
  await createSession({
    userId: user.id,
    role: user.role,
    groupId: user.groupId,
  });
  redirect(homePathFor(user.role));
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
