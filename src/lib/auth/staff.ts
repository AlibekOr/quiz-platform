import "server-only";
import { cache } from "react";
import {
  requireAdmin,
  requireRole,
  requireTeacher,
  type CurrentUser,
} from "./guards";
import { getScope, type Scope } from "./scope";

// Xodim + doira bitta chaqiruvda. Doira bir so'rov ichida bir marta hisoblanadi
// (sahifa va uning komponentlari qayta-qayta bazaga bormaydi)

export type StaffContext = { user: CurrentUser; scope: Scope };

const scopeFor = cache((user: CurrentUser) => getScope(user));

/** Sahifa komponentlari uchun (masalan, yon panel nishonlari): so'rov ichida bir marta */
export const getScopeOf = scopeFor;

export async function requireTeacherScope(): Promise<StaffContext> {
  const user = await requireTeacher();
  return { user, scope: await scopeFor(user) };
}

/** ADMIN, TEACHER yoki MANAGER — har biri o'z doirasi bilan */
export async function requireStaffScope(): Promise<StaffContext> {
  const user = await requireRole(["ADMIN", "TEACHER", "MANAGER"]);
  return { user, scope: await scopeFor(user) };
}

/** ADMIN yoki TEACHER: o'quvchini arxivlash/o'chirish, guruhdan chiqarish va h.k. (menejer emas) */
export async function requireTeacherOrAdminScope(): Promise<StaffContext> {
  const user = await requireRole(["ADMIN", "TEACHER"]);
  return { user, scope: await scopeFor(user) };
}

export async function requireAdminScope(): Promise<StaffContext> {
  const user = await requireAdmin();
  return { user, scope: { kind: "all" } };
}
