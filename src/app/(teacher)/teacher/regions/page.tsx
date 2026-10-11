import type { Metadata } from "next";
import Link from "next/link";
import { RegionsSection } from "@/components/teacher/managers/regions-section";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Regionlar" };

// Regionlar: qo'shish va nomini o'zgartirish (action'lar — teacher/managers/actions.ts)
export default async function RegionsPage() {
  await requireTeacher();
  const regions = await db.region.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: { select: { groups: true, managers: true } },
    },
  });

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Regionlar</h1>
        <p className="text-muted-foreground text-sm">
          Guruh regioni{" "}
          <Link href="/teacher/groups" className="underline">
            Guruhlar
          </Link>{" "}
          sahifasida, menejer regioni{" "}
          <Link href="/teacher/managers" className="underline">
            Menejerlar
          </Link>{" "}
          sahifasida tanlanadi.
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
