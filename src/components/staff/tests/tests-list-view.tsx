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
import type { CurrentUser } from "@/lib/auth/guards";
import { getScope, studentScopeWhere } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { staffBase, testScopeWhere } from "@/lib/tests/access";

/** Testlar ro'yxati (o'qituvchi — hammasi, menejer — doiradagi va o'zi yaratganlari) */
export async function TestsListView({ user }: { user: CurrentUser }) {
  const scope = await getScope(user);
  const base = staffBase(user.role);
  const tests = await db.test.findMany({
    where: testScopeWhere(scope),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      durationMin: true,
      isActive: true,
      groups: { select: { name: true }, orderBy: { name: "asc" } },
      // Menejer uchun urinishlar soni ham faqat doiradagi o'quvchilar bo'yicha
      _count: {
        select: {
          questions: true,
          attempts: { where: { user: studentScopeWhere(scope) } },
        },
      },
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
                      href={`${base}/tests/${t.id}`}
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
