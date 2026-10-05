import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession } from "./session";

export type CurrentUser = {
  id: string;
  username: string;
  fullName: string;
  role: "TEACHER" | "STUDENT";
  groupId: string | null;
};

export const getSession = cache(readSession);

/**
 * Cookie'dagi sessiyani bazadagi user bilan tekshiradi: login'dan keyin bloklangan
 * yoki o'chirilgan user darhol chiqib ketadi. Rol va guruh bazadan olinadi.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      groupId: true,
      isActive: true,
      sessionVersion: true,
    },
  });
  if (!user || !user.isActive) return null;
  // Parol tiklangandan keyin eski sessiyalar ishlamaydi
  if (user.sessionVersion !== session.sessionVersion) return null;

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    groupId: user.groupId,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireTeacher(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "TEACHER") redirect("/dashboard");
  return user;
}

export async function requireStudent(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect("/teacher");
  return user;
}
