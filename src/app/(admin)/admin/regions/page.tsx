import type { Metadata } from "next";
import Link from "next/link";
import { RegionsSection } from "@/components/teacher/managers/regions-section";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Regionlar" };

// Regionlar: qo'shish va nomini o'zgartirish (faqat ADMIN; action'lar — admin/actions.ts)
export default async function RegionsPage() {
  await requireAdmin();
  const regions = await db.region.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { groups: true, managers: true, teachers: true } },
    },
  });

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Regionlar</h1>
        <p className="text-muted-foreground text-sm">
          Regionlar o&apos;qituvchilarga{" "}
          <Link prefetch={false} href="/admin/teachers" className="underline">
            O&apos;qituvchilar
          </Link>{" "}
          sahifasida biriktiriladi. Guruh va menejer regioni o&apos;qituvchi
          regionlaridan tanlanadi.
        </p>
      </div>
      <RegionsSection
        regions={regions.map((r) => ({
          id: r.id,
          name: r.name,
          groupCount: r._count.groups,
          managerCount: r._count.managers,
        }))}
      />
    </>
  );
}
