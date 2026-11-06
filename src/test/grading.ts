import { db } from "@/lib/db";
import { DEFAULT_TEMPLATE, type AssignmentCategory } from "@/lib/grades";

// Testlar uchun: semestrga standart kategoriyalar (eski 30/20/10/40 tizimi) va
// topshiriq uchun shu turdagi semestr kategoriyasi

/** db.semester.create({ data: { ..., categories: standardCategories } }) */
export const standardCategories = {
  create: DEFAULT_TEMPLATE.categories.map((c, order) => ({ ...c, order })),
};

export async function categoryIdOf(
  semesterId: string,
  kind: AssignmentCategory,
): Promise<string> {
  const category = await db.semesterCategory.findFirstOrThrow({
    where: { semesterId, kind },
    select: { id: true },
  });
  return category.id;
}
