import type { Metadata } from "next";
import Link from "next/link";
import { CreateTestButton } from "@/components/teacher/tests/create-test-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Testlar" };

export default async function TestsPage() {
  await requireTeacher();

  const tests = await db.test.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      durationMin: true,
      isActive: true,
      groups: { select: { name: true }, orderBy: { name: "asc" } },
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Testlar</h1>
        <CreateTestButton />
      </div>

      {tests.length === 0 ? (
        <p className="text-muted-foreground">
          Hali test yo&apos;q. Birinchi testni yarating.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Guruhlar</TableHead>
                <TableHead className="text-right">Savollar</TableHead>
                <TableHead className="text-right">Vaqt</TableHead>
                <TableHead className="text-right">Urinishlar</TableHead>
                <TableHead>Holat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/teacher/tests/${t.id}`}
                      className="hover:underline"
                    >
                      {t.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.groups.length > 0
                      ? t.groups.map((g) => g.name).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {t._count.questions}
                  </TableCell>
                  <TableCell className="text-right">
                    {t.durationMin} daq
                  </TableCell>
                  <TableCell className="text-right">
                    {t._count.attempts}
                  </TableCell>
                  <TableCell>
                    {t.isActive ? (
                      <Badge>Faol</Badge>
                    ) : (
                      <Badge variant="secondary">Qoralama</Badge>
                    )}
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
