"use server";

import { revalidatePath } from "next/cache";
import { CACHE_TAGS, invalidateCache } from "@/lib/cached-data";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { canAccessGroup, FORBIDDEN } from "@/lib/auth/scope";
import { requireTeacherScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { createGroupRecord, isTeacherRegion } from "@/lib/groups-data";
import {
  scheduleFormSchema,
  scheduleRowSchema,
  type ScheduleFormInput,
} from "@/lib/validators/attendance";
import { isNotFound } from "@/lib/prisma-errors";
import { groupRegionSchema } from "@/lib/validators/manager";
import { groupFormSchema, type GroupFormInput } from "@/lib/validators/student";

const idSchema = z.string().min(1);

function revalidate() {
  revalidatePath("/teacher/groups");
  revalidatePath("/teacher/students");
  revalidatePath("/teacher/managers");
}

export async function createGroup(
  input: GroupFormInput & { regionId: string },
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const parsed = groupFormSchema.merge(groupRegionSchema).safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const { name, regionId } = parsed.data;
  // Faqat o'qituvchining o'z regionlaridan biri (yoki regionsiz)
  if (!(await isTeacherRegion(user.id, regionId)))
    return { ok: false, error: "Region topilmadi" };

  // Nom takrorlanishi mumkin — guruhni kod farqlaydi
  const { code } = await createGroupRecord({
    name,
    regionId,
    teacherId: user.id,
  });
  revalidate();
  return { ok: true, message: `Guruh yaratildi: ${code}` };
}

export async function renameGroup(
  groupId: string,
  input: GroupFormInput,
): Promise<ActionResult> {
  const { scope } = await requireTeacherScope();
  const id = idSchema.parse(groupId);
  const parsed = groupFormSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if (!canAccessGroup(scope, id)) return FORBIDDEN;

  // Kod o'zgarmaydi
  try {
    await db.group.update({ where: { id }, data: { name: parsed.data.name } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Guruh topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Guruh nomi o'zgartirildi" };
}

/** Guruh regioni o'qituvchi regionlari ichida o'zgaradi; kod o'zgarmaydi */
export async function setGroupRegion(
  groupId: string,
  regionId: string,
): Promise<ActionResult> {
  const { user, scope } = await requireTeacherScope();
  const id = idSchema.parse(groupId);
  const parsed = groupRegionSchema.safeParse({ regionId });
  if (!parsed.success) return validationFailed(parsed.error);
  if (!canAccessGroup(scope, id)) return FORBIDDEN;
  if (!(await isTeacherRegion(user.id, parsed.data.regionId)))
    return { ok: false, error: "Region topilmadi" };

  try {
    await db.group.update({
      where: { id },
      data: { regionId: parsed.data.regionId },
    });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Guruh topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Region saqlandi" };
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  const { scope } = await requireTeacherScope();
  const id = idSchema.parse(groupId);
  if (!canAccessGroup(scope, id)) return FORBIDDEN;

  const students = await db.user.count({
    where: { groupId: id, archivedAt: null },
  });
  if (students > 0) {
    return {
      ok: false,
      error: `Guruhda ${students} ta o'quvchi bor. Avval ularni boshqa guruhga o'tkazing`,
    };
  }

  // Dars o'chsa davomat ham o'chadi (cascade), shu jumladan boshqa guruhga o'tganlarniki
  const lessons = await db.lesson.count({ where: { groupId: id } });
  if (lessons > 0) {
    return {
      ok: false,
      error: `Guruhda ${lessons} ta dars tarixi bor. Davomat yo'qolmasligi uchun guruhni o'chirib bo'lmaydi`,
    };
  }

  try {
    // Arxivdagilar guruhsiz qoladi: tiklanganda boshqa guruhga qo'shiladi.
    // Guruhning a'zolik tarixi guruh bilan birga o'chadi (cascade); darsi yo'q guruh
    await db.$transaction([
      db.user.updateMany({
        where: { groupId: id, archivedAt: { not: null } },
        data: { groupId: null },
      }),
      db.group.delete({ where: { id } }),
    ]);
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Guruh topilmadi" };
    throw e;
  }
  invalidateCache(CACHE_TAGS.schedules);
  revalidate();
  return { ok: true, message: "Guruh o'chirildi" };
}

export async function saveSchedule(
  groupId: string,
  input: ScheduleFormInput,
): Promise<ActionResult> {
  const { scope } = await requireTeacherScope();
  const id = idSchema.parse(groupId);
  const parsed = scheduleFormSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if (!canAccessGroup(scope, id)) return FORBIDDEN;

  const days = parsed.data.days
    .filter((d) => d.enabled)
    .map((d) =>
      scheduleRowSchema.parse({
        weekday: d.weekday,
        startTime: d.startTime,
        endTime: d.endTime,
      }),
    );

  if ((await db.group.count({ where: { id } })) === 0)
    return { ok: false, error: "Guruh topilmadi" };

  await db.$transaction([
    db.groupSchedule.deleteMany({ where: { groupId: id } }),
    db.groupSchedule.createMany({
      data: days.map((d) => ({ ...d, groupId: id })),
    }),
  ]);
  invalidateCache(CACHE_TAGS.schedules);
  revalidatePath(`/teacher/groups/${id}`);
  revalidatePath("/teacher/groups");
  revalidatePath("/teacher/attendance");
  return { ok: true, message: "Dars jadvali saqlandi" };
}
