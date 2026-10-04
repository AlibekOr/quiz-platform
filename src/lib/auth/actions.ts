"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { homePathFor } from "./jwt";
import { verifyAgainstDummy, verifyPassword } from "./password";
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "./rate-limit";
import { createSession, deleteSession } from "./session";

export type LoginState = { error?: string; username?: string };

const INVALID_CREDENTIALS = "Login yoki parol noto'g'ri";

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Login va parolni kiriting", username };
  }
  if (username.length > 64 || password.length > 128) {
    return { error: INVALID_CREDENTIALS, username };
  }

  if (await isLoginLocked(username)) {
    return {
      error:
        "Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urinib ko'ring",
      username,
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
    return { error: INVALID_CREDENTIALS, username };
  }
  if (!user.isActive) {
    return { error: INVALID_CREDENTIALS, username };
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
