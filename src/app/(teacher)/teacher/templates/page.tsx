import type { Metadata } from "next";
import { TemplatesSection } from "@/components/teacher/grades/templates-section";
import { requireTeacherScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { ensureDefaultTemplate } from "@/lib/templates";

export const metadata: Metadata = { title: "Baholash shablonlari" };

// Sozlamalar → Baholash shablonlari: faqat o'qituvchining o'z shablonlari
export default async function TemplatesPage() {
  const { user } = await requireTeacherScope();
  await ensureDefaultTemplate(user.id);
  const templates = await db.gradingTemplate.findMany({
    where: { ownerId: user.id },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      maxTotal: true,
      passPercent: true,
      failBelow: true,
      extraMode: true,
      extraBeyondMax: true,
      isDefault: true,
      categories: {
        orderBy: { order: "asc" },
        select: {
          name: true,
          kind: true,
          cap: true,
          itemMin: true,
          itemMax: true,
          step: true,
        },
      },
      _count: { select: { semesters: true } },
    },
  });

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Baholash shablonlari</h1>
        <p className="text-muted-foreground text-sm">
          Semestr yaratilganda shablon qoidalari semestrga nusxalanadi.
          Shablonni o&apos;zgartirish mavjud semestrlar ballariga ta&apos;sir
          qilmaydi.
        </p>
      </div>
      <TemplatesSection
        templates={templates.map(({ _count, categories, ...t }) => ({
          ...t,
          categories,
          semesterCount: _count.semesters,
        }))}
      />
    </>
  );
}
