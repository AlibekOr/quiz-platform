import type { Metadata } from "next";
import {
  CreateTeacherButton,
  StaffRowActions,
} from "@/components/admin/admin-controls";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/guards";
import { getRegionOptions } from "@/lib/cached-data";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "O'qituvchilar" };

// ADMIN: o'qituvchilar — yaratish, regionlar, bloklash, parol; guruhlar, menejerlar, o'quvchilar soni
export default async function TeachersPage() {
  await requireAdmin();
  const [teachers, regions] = await Promise.all([
    db.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        username: true,
        isActive: true,
        teacherRegions: {
          orderBy: { region: { name: "asc" } },
          select: { region: { select: { id: true, name: true } } },
        },
        taughtGroups: {
          select: {
            _count: { select: { students: { where: { archivedAt: null } } } },
          },
        },
        _count: { select: { managers: true } },
      },
    }),
    getRegionOptions(),
  ]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">O&apos;qituvchilar</h1>
        <CreateTeacherButton regions={regions} />
      </div>
      {teachers.length === 0 ? (
        <p className="text-muted-foreground">Hali o&apos;qituvchi yo&apos;q.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground w-10">№</TableHead>
                <TableHead>F.I.Sh</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Regionlar</TableHead>
                <TableHead className="text-right">Guruhlar</TableHead>
                <TableHead className="text-right">O&apos;quvchilar</TableHead>
                <TableHead className="text-right">Menejerlar</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Amallar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t, i) => (
                <TableRow
                  key={t.id}
                  className={t.isActive ? undefined : "text-muted-foreground"}
                >
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{t.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {t.username}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.teacherRegions.map((r) => r.region.name).join(", ") ||
                      "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.taughtGroups.length}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t.taughtGroups.reduce((s, g) => s + g._count.students, 0)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {t._count.managers}
                  </TableCell>
                  <TableCell>
                    {t.isActive ? (
                      <Badge variant="secondary">Faol</Badge>
                    ) : (
                      <Badge variant="destructive">Bloklangan</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StaffRowActions
                      staff={t}
                      regions={regions}
                      regionIds={t.teacherRegions.map((r) => r.region.id)}
                    />
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
