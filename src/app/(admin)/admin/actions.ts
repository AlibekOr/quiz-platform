"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { CACHE_TAGS, invalidateCache } from "@/lib/cached-data";
import { db } from "@/lib/db";
import { isTeacherRegion } from "@/lib/groups-data";
import { DEFAULT_PENALTY_TYPES } from "@/lib/penalties-defaults";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { ensureDefaultTemplate } from "@/lib/templates";
import {
  teacherCreateSchema,
  teacherRegionsSchema,
  type TeacherCreateInput,
  type TeacherRegionsInput,
} from "@/lib/validators/admin";
import {
  groupRegionSchema,
  regionSchema,
  type RegionInput,
} from "@/lib/validators/manager";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validators/student";

// ADMIN: regionlar, o'qituvchilar, xodimlarni bloklash va parol tiklash, guruh regioni
// (ROLES.md §4). Har bir action o'zi requireAdmin() chaqiradi

const idSchema = z.string().min(1).max(64);

function revalidate() {
  revalidatePath("/admin", "layout");
}

const usernameTaken: ActionResult = {
  ok: false,
  error: "Maydonlarni tekshiring",
  fieldErrors: { username: ["Bunday login allaqachon mavjud"] },
};

// ---------- Regionlar ----------

const regionTaken: ActionResult = {
  ok: false,
  error: "Maydonlarni tekshiring",
  fieldErrors: { name: ["Bunday nomli region bor"] },
};

export async function createRegion(input: RegionInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = regionSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  try {
    await db.region.create({ data: { name: parsed.data.name } });
  } catch (e) {
    if (isUniqueViolation(e)) return regionTaken;
    throw e;
  }
  invalidateCache(CACHE_TAGS.regions);
  revalidate();
  return { ok: true, message: "Region qo'shildi" };
}

export async function renameRegion(
  regionId: string,
  input: RegionInput,
): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.parse(regionId);
  const parsed = regionSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  try {
    await db.region.update({ where: { id }, data: { name: parsed.data.name } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Region topilmadi" };
    if (isUniqueViolation(e)) return regionTaken;
    throw e;
  }
  invalidateCache(CACHE_TAGS.regions);
  revalidate();
  return { ok: true, message: "Region nomi o'zgartirildi" };
}

// ---------- O'qituvchilar ----------

async function regionsExist(ids: readonly string[]): Promise<boolean> {
  return (
    (await db.region.count({ where: { id: { in: [...ids] } } })) === ids.length
  );
}

/** Yangi o'qituvchi: regionlari, standart baholash shabloni va namunaviy jarima shablonlari */
export async function createTeacher(
  input: TeacherCreateInput,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = teacherCreateSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { fullName, username, password } = parsed.data;
  const regionIds = [...new Set(parsed.data.regionIds)];
  if (!(await regionsExist(regionIds)))
    return { ok: false, error: "Regionlardan biri topilmadi" };
  const taken = await db.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { id: true },
  });
  if (taken) return usernameTaken;
  let teacherId: string;
  try {
    const teacher = await db.user.create({
      data: {
        fullName,
        username,
        role: "TEACHER",
        createdById: admin.id,
        passwordHash: await hashPassword(password),
        teacherRegions: { create: regionIds.map((regionId) => ({ regionId })) },
        penaltyTypes: { create: DEFAULT_PENALTY_TYPES.map((t) => ({ ...t })) },
      },
      select: { id: true },
    });
    teacherId = teacher.id;
  } catch (e) {
    if (isUniqueViolation(e)) return usernameTaken;
    throw e;
  }
  await ensureDefaultTemplate(teacherId);
  revalidate();
  return { ok: true, message: "O'qituvchi qo'shildi" };
}

/** Regionni olib tashlash — faqat o'qituvchining o'sha regionda guruhi qolmagan bo'lsa */
export async function setTeacherRegions(
  teacherId: string,
  input: TeacherRegionsInput,
): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.parse(teacherId);
  const parsed = teacherRegionsSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const regionIds = [...new Set(parsed.data.regionIds)];
  if ((await db.user.count({ where: { id, role: "TEACHER" } })) === 0)
    return { ok: false, error: "O'qituvchi topilmadi" };
  if (!(await regionsExist(regionIds)))
    return { ok: false, error: "Regionlardan biri topilmadi" };
  const stranded = await db.group.findFirst({
    where: {
      teacherId: id,
      regionId: { not: null, notIn: regionIds },
    },
    select: { name: true, region: { select: { name: true } } },
  });
  if (stranded)
    return {
      ok: false,
      error: `"${stranded.region?.name}" regionida "${stranded.name}" guruhi bor. Avval guruh regionini o'zgartiring`,
    };
  await db.$transaction([
    db.teacherRegion.deleteMany({
      where: { teacherId: id, regionId: { notIn: regionIds } },
    }),
    db.teacherRegion.createMany({
      data: regionIds.map((regionId) => ({ teacherId: id, regionId })),
      skipDuplicates: true,
    }),
  ]);
  revalidate();
  return { ok: true, message: "Regionlar saqlandi" };
}

// ---------- Xodimlar: bloklash, parol ----------

const staffWhere = (id: string) => ({
  id,
  role: { in: ["TEACHER" as const, "MANAGER" as const] },
});

/** Bloklangan xodimning ochiq sessiyasi ham ishlamay qoladi (guards.ts isActive tekshiradi) */
export async function setStaffActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.parse(userId);
  const active = z.boolean().parse(isActive);
  try {
    await db.user.update({ where: staffWhere(id), data: { isActive: active } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Xodim topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: active ? "Blokdan chiqarildi" : "Bloklandi" };
}

export async function resetStaffPassword(
  userId: string,
  input: ResetPasswordInput,
): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.parse(userId);
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  try {
    await db.user.update({
      where: staffWhere(id),
      // Eski sessiyalar yopiladi
      data: {
        passwordHash: await hashPassword(parsed.data.password),
        sessionVersion: { increment: 1 },
      },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Xodim topilmadi" };
    throw e;
  }
  return { ok: true, message: "Parol yangilandi" };
}

// ---------- Guruh regioni (regionsiz guruhlar) ----------

/** Region guruh o'qituvchisining regionlaridan biri bo'lishi shart; guruh kodi o'zgarmaydi */
export async function setGroupRegionAdmin(
  groupId: string,
  regionId: string,
): Promise<ActionResult> {
  await requireAdmin();
  const id = idSchema.parse(groupId);
  const parsed = groupRegionSchema.safeParse({ regionId });
  if (!parsed.success) return validationFailed(parsed.error);
  const group = await db.group.findUnique({
    where: { id },
    select: { teacherId: true },
  });
  if (!group) return { ok: false, error: "Guruh topilmadi" };
  if (!(await isTeacherRegion(group.teacherId, parsed.data.regionId)))
    return {
      ok: false,
      error:
        "Bu region guruh o'qituvchisiga biriktirilmagan. Avval o'qituvchiga regionni qo'shing",
    };
  await db.group.update({
    where: { id },
    data: { regionId: parsed.data.regionId },
  });
  revalidate();
  return { ok: true, message: "Region saqlandi" };
}
