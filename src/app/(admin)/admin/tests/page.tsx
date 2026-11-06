import type { Metadata } from "next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { groupLabel } from "@/lib/group-label";

export const metadata: Metadata = { title: "Testlar" };

// ADMIN: barcha testlar (faqat ko'rish) — egasi, guruhlari, savollar va urinishlar soni
export default async function AdminTestsPage() {
  await requireAdmin();
  const tests = await db.test.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      title: true,
      isActive: true,
      owner: { select: { fullName: true } },
      createdBy: { select: { fullName: true } },
      groups: { select: { name: true, code: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Testlar</h1>
      {tests.length === 0 ? (
        <p className="text-muted-foreground">Hali test yo&apos;q.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground w-10">№</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Egasi</TableHead>
                <TableHead className="hidden md:table-cell">Guruhlar</TableHead>
                <TableHead className="text-right">Savollar</TableHead>
                <TableHead className="text-right">Urinishlar</TableHead>
                <TableHead>Holat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((t, i) => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="text-sm">
                    {t.owner?.fullName ?? `${t.createdBy.fullName} (menejer)`}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                    {t.groups.map(groupLabel).join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t._count.questions}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t._count.attempts}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.isActive ? "Faol" : "Nofaol"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
