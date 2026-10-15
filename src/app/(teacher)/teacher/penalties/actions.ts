"use server";

import { revalidatePath } from "next/cache";
import { CACHE_TAGS, invalidateCache } from "@/lib/cached-data";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatPoints } from "@/lib/grades";
import { applyPenalty } from "@/lib/penalties";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import {
  applyPenaltySchema,
  penaltyTypeSchema,
  type ApplyPenaltyInput,
  type PenaltyTypeInput,
} from "@/lib/validators/penalties";

// Jarima shablonlari va jarimalar: faqat o'qituvchi (TASKS.md, "Huquqlar")

const idSchema = z.string().min(1).max(64);

function revalidate() {
  invalidateCache(CACHE_TAGS.penaltyTypes);
  revalidatePath("/teacher/penalties");
  revalidatePath("/teacher/grades");
  revalidatePath("/teacher/students/[id]", "page");
  revalidatePath("/teacher/attendance/[groupId]/[date]", "page");
  revalidatePath("/grades");
  revalidatePath("/profile");
}

const nameTaken: ActionResult = {
  ok: false,
  error: "Maydonlarni tekshiring",
  fieldErrors: { name: ["Bunday nomli shablon bor"] },
};

export async function createPenaltyType(
  input: PenaltyTypeInput,
): Promise<ActionResult> {
  await requireTeacher();
  const parsed = penaltyTypeSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  try {
    await db.penaltyType.create({ data: parsed.data });
  } catch (e) {
    if (isUniqueViolation(e)) return nameTaken;
    throw e;
  }
  revalidate();
  return { ok: true, message: "Shablon qo'shildi" };
}

/** Shablon o'zgarsa, oldin qo'yilgan jarimalar (ball nusxasi) o'zgarmaydi */
export async function updatePenaltyType(
  typeId: string,
  input: PenaltyTypeInput,
): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(typeId);
  const parsed = penaltyTypeSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  try {
    await db.penaltyType.update({ where: { id }, data: parsed.data });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Shablon topilmadi" };
    if (isUniqueViolation(e)) return nameTaken;
    throw e;
  }
  revalidate();
  return { ok: true, message: "Shablon saqlandi" };
}

/** Faqat hali ishlatilmagan shablon o'chadi; aks holda nofaol qilish kerak (nomi saqlanadi) */
export async function deletePenaltyType(typeId: string): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(typeId);
  const used = await db.penalty.count({ where: { typeId: id } });
  if (used > 0)
    return {
      ok: false,
      error: `Shablon ${used} ta jarimada ishlatilgan. O'chirish o'rniga nofaol qiling`,
    };
  try {
    await db.penaltyType.delete({ where: { id } });
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Shablon topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Shablon o'chirildi" };
}

export async function applyPenaltyAction(
  input: ApplyPenaltyInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const parsed = applyPenaltySchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  const result = await applyPenalty({
    ...parsed.data,
    createdById: teacher.id,
  });
  if (!result.ok) return { ok: false, error: result.error };
  revalidate();
  return {
    ok: true,
    message:
      result.count === 1
        ? "Jarima qo'yildi"
        : `${result.count} ta o'quvchiga jarima qo'yildi`,
  };
}

/** Jarimani bekor qilish (o'chirish) */
export async function deletePenalty(penaltyId: string): Promise<ActionResult> {
  await requireTeacher();
  const id = idSchema.parse(penaltyId);
  try {
    const p = await db.penalty.delete({
      where: { id },
      select: { points: true },
    });
    revalidate();
    return {
      ok: true,
      message: `Jarima bekor qilindi (−${formatPoints(p.points)})`,
    };
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Jarima topilmadi" };
    throw e;
  }
}
