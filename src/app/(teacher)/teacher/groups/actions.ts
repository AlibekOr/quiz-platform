"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  scheduleFormSchema,
  scheduleRowSchema,
  type ScheduleFormInput,
} from "@/lib/validators/attendance";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { groupFormSchema, type GroupFormInput } from "@/lib/validators/student";

const idSchema = z.string().min(1);

function revalidate() {
  revalidatePath("/teacher/groups");
  revalidatePath("/teacher/students");
}

export async function createGroup(
  input: GroupFormInput,
): Promise<ActionResult> {
  await requireTeacher();
  const parsed = groupFormSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  try {
    await db.group.create({ data: { name: parsed.data.name } });
  } catch (e) {
    if (isUniqueViolation(e))
      return {
        ok: false,
        error: "Maydonlarni tekshiring",
        fieldErrors: { name: ["Bunday nomli guruh bor"] },
      };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Guruh yaratildi" };
}

export async function renameGroup(
  groupId: string,
  input: GroupFormInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(groupId);
  const parsed = groupFormSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  try {
    await db.group.update({ where: { id }, data: { name: parsed.data.name } });
  } catch (e) {
    if (isUniqueViolation(e))
      return {
        ok: false,
        error: "Maydonlarni tekshiring",
        fieldErrors: { name: ["Bunday nomli guruh bor"] },
      };
    if (isNotFound(e)) return { ok: false, error: "Guruh topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Guruh nomi o'zgartirildi" };
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(groupId);

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
    // Arxivdagilar guruhsiz qoladi: tiklanganda boshqa guruhga qo'shiladi
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
  revalidate();
  return { ok: true, message: "Guruh o'chirildi" };
}

export async function saveSchedule(
  groupId: string,
  input: ScheduleFormInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(groupId);
  const parsed = scheduleFormSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

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
  revalidatePath(`/teacher/groups/${id}`);
  revalidatePath("/teacher/groups");
  revalidatePath("/teacher/attendance");
  return { ok: true, message: "Dars jadvali saqlandi" };
}
