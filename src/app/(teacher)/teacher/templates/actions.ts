"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireTeacherScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { isNotFound, isUniqueViolation } from "@/lib/prisma-errors";
import { saveTemplate } from "@/lib/templates";
import { templateSchema, type TemplateInput } from "@/lib/validators/grades";

// Baholash shablonlari (ROLES.md §5): faqat o'qituvchining o'ziniki. O'zgarish faqat KEYIN
// yaratiladigan semestrlarga ta'sir qiladi — mavjud semestrlarda nusxa bor

const idSchema = z.string().min(1).max(64);

const nameTaken: ActionResult = {
  ok: false,
  error: "Maydonlarni tekshiring",
  fieldErrors: { name: ["Bunday nomli shablon bor"] },
};

function revalidate() {
  revalidatePath("/teacher/templates");
  revalidatePath("/teacher/groups/[id]", "page");
}

export async function saveTemplateAction(
  templateId: string | null,
  input: TemplateInput,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = templateId === null ? undefined : idSchema.parse(templateId);
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if (
    id &&
    (await db.gradingTemplate.count({ where: { id, ownerId: user.id } })) === 0
  )
    return { ok: false, error: "Shablon topilmadi" };
  try {
    await saveTemplate(user.id, parsed.data, id);
  } catch (e) {
    if (isUniqueViolation(e)) return nameTaken;
    if (isNotFound(e)) return { ok: false, error: "Shablon topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: id ? "Shablon saqlandi" : "Shablon qo'shildi" };
}

/** Semestrlar nusxasi bilan ishlaydi — shablonni o'chirish ularga ta'sir qilmaydi */
export async function deleteTemplate(
  templateId: string,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const id = idSchema.parse(templateId);
  const count = await db.gradingTemplate.count({ where: { ownerId: user.id } });
  if (count <= 1)
    return { ok: false, error: "Kamida bitta shablon qolishi kerak" };
  try {
    const deleted = await db.gradingTemplate.delete({
      where: { id, ownerId: user.id },
      select: { isDefault: true },
    });
    // Asosiy o'chsa — eng eskisi asosiy bo'ladi
    if (deleted.isDefault) {
      const next = await db.gradingTemplate.findFirst({
        where: { ownerId: user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (next)
        await db.gradingTemplate.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
    }
  } catch (e) {
    if (isNotFound(e)) return { ok: false, error: "Shablon topilmadi" };
    throw e;
  }
  revalidate();
  return { ok: true, message: "Shablon o'chirildi" };
}
