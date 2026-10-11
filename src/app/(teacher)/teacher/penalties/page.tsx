import type { Metadata } from "next";
import { PenaltyTypesSection } from "@/components/teacher/penalties/penalty-types-section";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Jarima shablonlari" };

export default async function PenaltyTypesPage() {
  await requireTeacher();
  const types = await db.penaltyType.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      defaultPoints: true,
      description: true,
      isActive: true,
      _count: { select: { penalties: true } },
    },
  });

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Jarima shablonlari</h1>
        <p className="text-muted-foreground text-sm">
          Jarima o&apos;quvchi kartochkasi, &quot;Baholar&quot; va davomat
          sahifalaridan bir bosishda qo&apos;yiladi. Ball shablondan nusxa
          olinadi: shablon o&apos;zgarsa, oldingi jarimalar o&apos;zgarmaydi.
        </p>
      </div>
      <PenaltyTypesSection
        types={types.map(({ _count, ...t }) => ({
          ...t,
          usedCount: _count.penalties,
        }))}
      />
    </>
  );
}
