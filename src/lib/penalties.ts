import "server-only";
import { db } from "@/lib/db";
import { getSemesterGrades } from "@/lib/grades-data";
import { toDbDate, todayInTashkent } from "@/lib/time";
import type { ApplyPenaltyData } from "@/lib/validators/penalties";

// Jarima qo'yish (TASKS.md, 5-bo'lim): bir shablon bir nechta o'quvchiga birdaniga.
// Ball shablondan nusxa olinadi (o'zgartirilgan bo'lsa — o'sha), keyin shablon o'zgarsa
// eski jarimalar o'zgarmaydi

export type PenaltyOption = {
  id: string;
  name: string;
  defaultPoints: number;
};

/** Tanlash ro'yxati uchun faqat faol shablonlar */
export async function getActivePenaltyTypes(): Promise<PenaltyOption[]> {
  return db.penaltyType.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, defaultPoints: true },
  });
}

export async function applyPenalty(
  input: ApplyPenaltyData & { createdById: string },
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  if (input.date > todayInTashkent())
    return { ok: false, error: "Kelajakdagi sana uchun jarima qo'yilmaydi" };

  const type = await db.penaltyType.findFirst({
    where: { id: input.typeId, isActive: true },
    select: { defaultPoints: true },
  });
  if (!type) return { ok: false, error: "Shablon topilmadi yoki nofaol" };

  const ids = [...new Set(input.studentIds)];
  const sheet = await getSemesterGrades(input.semesterId, ids);
  if (!sheet) return { ok: false, error: "Semestr topilmadi" };
  if (sheet.students.length !== ids.length)
    return {
      ok: false,
      error:
        "Ba'zi o'quvchilar bu semestrda guruhda bo'lmagan. Sahifani yangilang",
    };

  const points = input.points ?? type.defaultPoints;
  const { count } = await db.penalty.createMany({
    data: ids.map((studentId) => ({
      studentId,
      semesterId: input.semesterId,
      typeId: input.typeId,
      points,
      note: input.note,
      date: toDbDate(input.date),
      createdById: input.createdById,
    })),
  });
  return { ok: true, count };
}
