"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { hashPassword } from "@/lib/auth/password";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import {
  managerCreateSchema,
  managerGroupsSchema,
  managerUpdateSchema,
  regionSchema,
  type ManagerCreateInput,
  type ManagerGroupsInput,
  type ManagerUpdateInput,
  type RegionInput,
} from "@/lib/validators/manager";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validators/student";

// Menejerlar va regionlarni faqat o'qituvchi boshqaradi (PLAN.md, 13-bosqich)

const idSchema = z.string().min(1).max(64);

function revalidate() {
  revalidatePath("/teacher/managers");
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

async function regionMissing(
  regionId: string | null,
): Promise<ActionResult | null> {
  if (regionId === null) return null;
  if ((await db.region.count({ where: { id: regionId } })) > 0) return null;
  return {
    ok: false,
    error: "Maydonlarni tekshiring",
    fieldErrors: { regionId: ["Region topilmadi"] },
  };
}

// ---------- Menejerlar ----------

export async function createManager(
  input: ManagerCreateInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const parsed = managerCreateSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { fullName, username, regionId, password } = parsed.data;

  const missing = await regionMissing(regionId);
  if (missing) return missing;
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
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return usernameTaken;
    throw e;
  }
  revalidate();
  return { ok: true, message: "Menejer qo'shildi" };
}

/** Region o'zgarsa, menejerning doirasi keyingi so'rovdanoq yangilanadi (bazadan olinadi) */
export async function updateManager(
  managerId: string,
  input: ManagerUpdateInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(managerId);
  const parsed = managerUpdateSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { fullName, username, regionId } = parsed.data;

  const missing = await regionMissing(regionId);
  if (missing) return missing;
  if (await isUsernameTaken(username, id)) return usernameTaken;
  try {
    // role sharti: bu yerdan faqat menejer akkauntlari o'zgaradi
    await db.user.update({
      where: { id, role: "MANAGER" },
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
  await requireTeacher();
  const id = idSchema.parse(managerId);
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  try {
    await db.user.update({
      where: { id, role: "MANAGER" },
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
  await requireTeacher();
  const id = idSchema.parse(managerId);
  const active = z.boolean().parse(isActive);
  try {
    await db.user.update({
      where: { id, role: "MANAGER" },
      data: { isActive: active },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Menejer topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: active ? "Blokdan chiqarildi" : "Bloklandi" };
}

/** Qo'shimcha biriktirilgan guruhlar ro'yxatini to'liq almashtiradi */
export async function setManagerGroups(
  managerId: string,
  input: ManagerGroupsInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(managerId);
  const parsed = managerGroupsSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const groupIds = [...new Set(parsed.data.groupIds)];

  const [manager, groups] = await Promise.all([
    db.user.count({ where: { id, role: "MANAGER" } }),
    db.group.count({ where: { id: { in: groupIds } } }),
  ]);
  if (manager === 0) return { ok: false, error: "Menejer topilmadi" };
  if (groups !== groupIds.length)
    return { ok: false, error: "Guruhlardan biri topilmadi" };

  await db.$transaction([
    db.managerGroup.deleteMany({
      where: { managerId: id, groupId: { notIn: groupIds } },
    }),
    db.managerGroup.createMany({
      data: groupIds.map((groupId) => ({ managerId: id, groupId })),
      skipDuplicates: true,
    }),
  ]);
  revalidate();
  return { ok: true, message: "Guruhlar saqlandi" };
}

// ---------- Regionlar ----------

const regionTaken: ActionResult = {
  ok: false,
  error: "Maydonlarni tekshiring",
  fieldErrors: { name: ["Bunday nomli region bor"] },
};

export async function createRegion(input: RegionInput): Promise<ActionResult> {
  await requireTeacher();
  const parsed = regionSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  try {
    await db.region.create({ data: { name: parsed.data.name } });
  } catch (e) {
    if (isUniqueViolation(e)) return regionTaken;
    throw e;
  }
  revalidate();
  return { ok: true, message: "Region qo'shildi" };
}

export async function renameRegion(
  regionId: string,
  input: RegionInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(regionId);
  const parsed = regionSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  try {
    await db.region.update({
      where: { id },
      data: { name: parsed.data.name },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Region topilmadi" };
    if (isUniqueViolation(e)) return regionTaken;
    throw e;
  }
  revalidate();
  return { ok: true, message: "Region nomi o'zgartirildi" };
}
