"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { hashPassword } from "@/lib/auth/password";
import { FORBIDDEN } from "@/lib/auth/scope";
import { requireTeacherScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { isTeacherRegion } from "@/lib/groups-data";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import {
  managerCreateSchema,
  managerGroupsSchema,
  managerUpdateSchema,
  type ManagerCreateInput,
  type ManagerGroupsInput,
  type ManagerUpdateInput,
} from "@/lib/validators/manager";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validators/student";

// Menejerlar (PLAN.md, 13-bosqich; ROLES.md §4). O'qituvchi faqat o'zi bilan ishlaydigan
// (TeacherManager) menejerlarni ko'radi. Yaratish — o'z regioniga; ism/login/region, parol va
// bloklash — faqat o'zi yaratgan menejerda; guruh biriktirish — faqat o'z guruhlarini (regionli).
// Regionlarni faqat ADMIN boshqaradi

const idSchema = z.string().min(1).max(64);

function revalidate() {
  revalidatePath("/teacher/managers");
  revalidatePath("/teacher/regions");
  revalidatePath("/teacher/groups");
}

const usernameTaken: ActionResult = {
  ok: false,
  error: "Maydonlarni tekshiring",
  fieldErrors: { username: ["Bunday login allaqachon mavjud"] },
};

async function isUsernameTaken(
  username: string,
  exceptId?: string,
): Promise<boolean> {
  const found = await db.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
      NOT: exceptId ? { id: exceptId } : undefined,
    },
    select: { id: true },
  });
  return found !== null;
}

/** Menejer regioni majburiy va o'qituvchining regionlaridan biri */
async function regionError(
  teacherId: string,
  regionId: string | null,
): Promise<ActionResult | null> {
  if (regionId !== null && (await isTeacherRegion(teacherId, regionId)))
    return null;
  return {
    ok: false,
    error: "Maydonlarni tekshiring",
    fieldErrors: {
      regionId: [regionId === null ? "Regionni tanlang" : "Region topilmadi"],
    },
  };
}

/** Shu o'qituvchi bilan ishlaydigan menejer */
function linkedManagerWhere(teacherId: string, id: string) {
  return { id, role: "MANAGER" as const, teachers: { some: { teacherId } } };
}

/** Shu o'qituvchi yaratgan (va u bilan ishlaydigan) menejer — tahrirlash, parol, bloklash */
function ownManagerWhere(teacherId: string, id: string) {
  return { ...linkedManagerWhere(teacherId, id), createdById: teacherId };
}

// ---------- Menejerlar ----------

export async function createManager(
  input: ManagerCreateInput,
): Promise<ActionResult> {
  const { user: teacher } = await requireTeacherScope();
  const parsed = managerCreateSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { fullName, username, regionId, password } = parsed.data;

  const regionInvalid = await regionError(teacher.id, regionId);
  if (regionInvalid) return regionInvalid;
  if (await isUsernameTaken(username)) return usernameTaken;
  try {
    await db.user.create({
      data: {
        fullName,
        username,
        regionId,
        role: "MANAGER",
        createdById: teacher.id,
        passwordHash: await hashPassword(password),
        // Yaratgan o'qituvchi bilan darhol bog'lanadi
        teachers: { create: { teacherId: teacher.id } },
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return usernameTaken;
    throw e;
  }
  revalidate();
  return { ok: true, message: "Menejer qo'shildi" };
}

/** Faqat o'zi yaratgan menejer; region — o'z regionlaridan biri */
export async function updateManager(
  managerId: string,
  input: ManagerUpdateInput,
): Promise<ActionResult> {
  const { user: teacher } = await requireTeacherScope();
  const id = idSchema.parse(managerId);
  const parsed = managerUpdateSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { fullName, username, regionId } = parsed.data;

  if ((await db.user.count({ where: ownManagerWhere(teacher.id, id) })) === 0)
    return FORBIDDEN;
  const regionInvalid = await regionError(teacher.id, regionId);
  if (regionInvalid) return regionInvalid;
  if (await isUsernameTaken(username, id)) return usernameTaken;
  try {
    // role sharti: bu yerdan faqat menejer akkauntlari o'zgaradi
    await db.user.update({
      where: ownManagerWhere(teacher.id, id),
      data: { fullName, username, regionId },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Menejer topilmadi" };
    if (isUniqueViolation(e)) return usernameTaken;
    throw e;
  }
  revalidate();
  return { ok: true, message: "O'zgarishlar saqlandi" };
}

export async function resetManagerPassword(
  managerId: string,
  input: ResetPasswordInput,
): Promise<ActionResult> {
  const { user: teacher } = await requireTeacherScope();
  const id = idSchema.parse(managerId);
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if ((await db.user.count({ where: ownManagerWhere(teacher.id, id) })) === 0)
    return FORBIDDEN;
  try {
    await db.user.update({
      where: ownManagerWhere(teacher.id, id),
      // Eski sessiyalar yopiladi
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        sessionVersion: { increment: 1 },
      },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Menejer topilmadi" };
    throw e;
  }
  return { ok: true, message: "Parol yangilandi" };
}

/** Bloklangan menejerning ochiq sessiyasi ham ishlamay qoladi (guards.ts isActive tekshiradi) */
export async function setManagerActive(
  managerId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { user: teacher } = await requireTeacherScope();
  const id = idSchema.parse(managerId);
  const active = z.boolean().parse(isActive);
  if ((await db.user.count({ where: ownManagerWhere(teacher.id, id) })) === 0)
    return FORBIDDEN;
  try {
    await db.user.update({
      where: ownManagerWhere(teacher.id, id),
      data: { isActive: active },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Menejer topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: active ? "Blokdan chiqarildi" : "Bloklandi" };
}

/**
 * Menejerga O'Z guruhlarini biriktirish: shu o'qituvchining guruhlari ichida ro'yxat to'liq
 * almashtiriladi, boshqa o'qituvchilar bergan guruhlarga tegilmaydi. Regionsiz guruh
 * biriktirilmaydi (u faqat o'qituvchiga ko'rinadi). Menejer boshqa regiondan ham bo'lishi mumkin
 */
export async function setManagerGroups(
  managerId: string,
  input: ManagerGroupsInput,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(managerId);
  const parsed = managerGroupsSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const groupIds = [...new Set(parsed.data.groupIds)];

  const [manager, groups] = await Promise.all([
    db.user.count({ where: linkedManagerWhere(user.id, id) }),
    db.group.count({
      where: {
        id: { in: groupIds },
        teacherId: user.id,
        regionId: { not: null },
      },
    }),
  ]);
  if (manager === 0) return FORBIDDEN;
  if (groups !== groupIds.length) return FORBIDDEN;

  await db.$transaction([
    db.managerGroup.deleteMany({
      where: {
        managerId: id,
        group: { teacherId: user.id },
        groupId: { notIn: groupIds },
      },
    }),
    db.managerGroup.createMany({
      data: groupIds.map((groupId) => ({
        managerId: id,
        groupId,
        assignedById: user.id,
      })),
      skipDuplicates: true,
    }),
  ]);
  revalidate();
  return { ok: true, message: "Guruhlar saqlandi" };
}

/**
 * O'z regionidagi mavjud menejer bilan ishlashni boshlash (ROLES.md §4). Guruhlarini keyin
 * alohida biriktiradi. Menejerning aloqa ma'lumotlari ko'rsatilmaydi — faqat ism va login
 */
export async function linkManager(managerId: string): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(managerId);
  const manager = await db.user.findFirst({
    where: { id, role: "MANAGER" },
    select: { regionId: true },
  });
  if (!manager?.regionId || !(await isTeacherRegion(user.id, manager.regionId)))
    return FORBIDDEN;
  await db.teacherManager.upsert({
    where: { teacherId_managerId: { teacherId: user.id, managerId: id } },
    update: {},
    create: { teacherId: user.id, managerId: id },
  });
  revalidate();
  return {
    ok: true,
    message: "Menejer qo'shildi. Endi unga guruh biriktiring",
  };
}

/**
 * Menejer bilan ishlashni to'xtatish: faqat shu o'qituvchining biriktirishlari olib tashlanadi,
 * menejer akkaunti va boshqa o'qituvchilar bergan guruhlar qoladi
 */
export async function unlinkManager(managerId: string): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(managerId);
  if ((await db.user.count({ where: linkedManagerWhere(user.id, id) })) === 0)
    return FORBIDDEN;
  await db.$transaction([
    db.managerGroup.deleteMany({
      where: { managerId: id, group: { teacherId: user.id } },
    }),
    db.teacherManager.delete({
      where: { teacherId_managerId: { teacherId: user.id, managerId: id } },
    }),
  ]);
  revalidate();
  return { ok: true, message: "Menejer bilan ishlash to'xtatildi" };
}
