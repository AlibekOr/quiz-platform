import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { homePathFor, type Role } from "./jwt";
import { readSession } from "./session";

export type CurrentUser = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  groupId: string | null;
  /** Menejerning regioni (doira har so'rovda bazadan hisoblanadi — lib/auth/scope.ts) */
  regionId: string | null;
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
      regionId: true,
      isActive: true,
      archivedAt: true,
      sessionVersion: true,
    },
  });
  if (!user || !user.isActive || user.archivedAt) return null;
  // Parol tiklangandan keyin eski sessiyalar ishlamaydi
  if (user.sessionVersion !== session.sessionVersion) return null;

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    groupId: user.groupId,
    regionId: user.regionId,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Rol mos kelmasa — o'z bosh sahifasiga yo'naltiriladi */
export async function requireRole(
  roles: readonly Role[],
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(homePathFor(user.role));
  return user;
}

export function requireTeacher(): Promise<CurrentUser> {
  return requireRole(["TEACHER"]);
}

export function requireManager(): Promise<CurrentUser> {
  return requireRole(["MANAGER"]);
}

/** O'qituvchi yoki menejer. Menejer uchun har bir so'rov doira bilan cheklanadi (scope.ts) */
export function requireStaff(): Promise<CurrentUser> {
  return requireRole(["TEACHER", "MANAGER"]);
}

export function requireStudent(): Promise<CurrentUser> {
  return requireRole(["STUDENT"]);
}
