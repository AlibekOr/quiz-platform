"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { groupNameSchema } from "@/lib/students/schema";

const idSchema = z.string().min(1);

function revalidate() {
  revalidatePath("/teacher/groups");
  revalidatePath("/teacher/students");
}

export async function createGroup(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireTeacher();
  const parsed = groupNameSchema.safeParse(formData.get("name"));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  try {
    await db.group.create({ data: { name: parsed.data } });
  } catch (e) {
    if (isUniqueViolation(e))
      return { ok: false, error: "Bunday nomli guruh bor" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Guruh yaratildi" };
}

export async function renameGroup(
  groupId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(groupId);
  const parsed = groupNameSchema.safeParse(formData.get("name"));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  try {
    await db.group.update({ where: { id }, data: { name: parsed.data } });
  } catch (e) {
    if (isUniqueViolation(e))
      return { ok: false, error: "Bunday nomli guruh bor" };
    if (isNotFound(e)) return { ok: false, error: "Guruh topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Guruh nomi o'zgartirildi" };
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(groupId);

  const students = await db.user.count({ where: { groupId: id } });
  if (students > 0) {
    return {
      ok: false,
      error: `Guruhda ${students} ta o'quvchi bor. Avval ularni boshqa guruhga o'tkazing`,
    };
  }

  try {
    await db.group.delete({ where: { id } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Guruh topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Guruh o'chirildi" };
}
