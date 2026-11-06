import "server-only";
import { db } from "@/lib/db";
import { DEFAULT_TEMPLATE, type TemplateDraft } from "@/lib/grades";
import { toDbDate, type DateStr } from "@/lib/time";

// Baholash shablonlari (ROLES.md §5): o'qituvchiniki. Semestr yaratilganda shablon
// semestrga nusxalanadi (snapshot) — shablon keyin o'zgarsa yoki o'chsa, eski semestr
// ballari o'zgarmaydi

/** Shablon maydonlari (egasisiz) va kategoriyalari */
function templateFields(draft: TemplateDraft, isDefault: boolean) {
  return {
    name: draft.name,
    maxTotal: draft.maxTotal,
    passPercent: draft.passPercent,
    failBelow: draft.failBelow,
    extraMode: draft.extraMode,
    extraBeyondMax: draft.extraBeyondMax,
    isDefault,
    categories: {
      create: draft.categories.map((c, order) => ({ ...c, order })),
    },
  };
}

/** O'qituvchida shablon bo'lmasa — standart shablon (eski 60/36/10, 30/20/10/40 tizimi) */
export async function ensureDefaultTemplate(ownerId: string): Promise<void> {
  if ((await db.gradingTemplate.count({ where: { ownerId } })) > 0) return;
  await db.gradingTemplate.create({
    data: { ownerId, ...templateFields(DEFAULT_TEMPLATE, true) },
  });
}

export async function getTemplateOptions(
  ownerId: string,
): Promise<{ id: string; name: string; isDefault: boolean }[]> {
  await ensureDefaultTemplate(ownerId);
  return db.gradingTemplate.findMany({
    where: { ownerId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: { id: true, name: true, isDefault: true },
  });
}

/** Shablon yaratish yoki to'liq almashtirish (kategoriyalar bilan); asosiy faqat bitta */
export async function saveTemplate(
  ownerId: string,
  draft: TemplateDraft & { isDefault: boolean },
  templateId?: string,
): Promise<string> {
  return db.$transaction(async (tx) => {
    if (draft.isDefault)
      await tx.gradingTemplate.updateMany({
        where: { ownerId, isDefault: true, NOT: { id: templateId } },
        data: { isDefault: false },
      });
    if (!templateId) {
      const created = await tx.gradingTemplate.create({
        data: { ownerId, ...templateFields(draft, draft.isDefault) },
        select: { id: true },
      });
      return created.id;
    }
    // Kategoriyalar to'liq almashtiriladi: semestrlarda nusxa bor, ularga tegmaydi
    await tx.gradeCategory.deleteMany({ where: { templateId } });
    await tx.gradingTemplate.update({
      where: { id: templateId, ownerId },
      data: templateFields(draft, draft.isDefault),
    });
    return templateId;
  });
}

/** Semestr + shablon nusxasi bitta tranzaksiyada. Shablon o'qituvchiniki bo'lishi shart */
export async function createSemesterFromTemplate(input: {
  groupId: string;
  ownerId: string;
  templateId: string;
  name: string;
  startDate: DateStr;
  endDate: DateStr;
  closed: boolean;
}): Promise<{ ok: true; id: string } | { ok: false }> {
  const template = await db.gradingTemplate.findFirst({
    where: { id: input.templateId, ownerId: input.ownerId },
    select: {
      id: true,
      maxTotal: true,
      passPercent: true,
      failBelow: true,
      extraMode: true,
      extraBeyondMax: true,
      categories: {
        orderBy: { order: "asc" },
        select: {
          name: true,
          kind: true,
          cap: true,
          itemMin: true,
          itemMax: true,
          step: true,
          order: true,
        },
      },
    },
  });
  if (!template) return { ok: false };
  const semester = await db.semester.create({
    data: {
      groupId: input.groupId,
      name: input.name,
      startDate: toDbDate(input.startDate),
      endDate: toDbDate(input.endDate),
      closed: input.closed,
      templateId: template.id,
      maxTotal: template.maxTotal,
      passPercent: template.passPercent,
      failBelow: template.failBelow,
      extraMode: template.extraMode,
      extraBeyondMax: template.extraBeyondMax,
      categories: { create: template.categories },
    },
    select: { id: true },
  });
  return { ok: true, id: semester.id };
}
