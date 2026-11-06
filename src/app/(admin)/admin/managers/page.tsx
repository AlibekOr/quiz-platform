import type { Metadata } from "next";
import { StaffRowActions } from "@/components/admin/admin-controls";
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
import { db } from "@/lib/db";
import { groupLabel } from "@/lib/group-label";

export const metadata: Metadata = { title: "Menejerlar" };

// ADMIN: barcha menejerlar, kim bilan ishlaydi va qaysi guruhlar biriktirilgan
export default async function AdminManagersPage() {
  await requireAdmin();
  const managers = await db.user.findMany({
    where: { role: "MANAGER" },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      username: true,
      isActive: true,
      region: { select: { name: true } },
      teachers: {
        orderBy: { teacher: { fullName: "asc" } },
        select: { teacher: { select: { fullName: true } } },
      },
      managedGroups: {
        orderBy: { group: { name: "asc" } },
        select: { group: { select: { name: true, code: true } } },
      },
    },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">Menejerlar</h1>
      <p className="text-muted-foreground text-sm">
        Menejerlarni o&apos;qituvchilar yaratadi va ularga o&apos;z guruhlarini
        biriktiradi. Bu yerda — bloklash va parolni tiklash.
      </p>
      {managers.length === 0 ? (
        <p className="text-muted-foreground">Hali menejer yo&apos;q.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground w-10">№</TableHead>
                <TableHead>F.I.Sh</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>O&apos;qituvchilar</TableHead>
                <TableHead className="hidden md:table-cell">Guruhlar</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Amallar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managers.map((m, i) => (
                <TableRow
                  key={m.id}
                  className={m.isActive ? undefined : "text-muted-foreground"}
                >
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{m.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {m.username}
                  </TableCell>
                  <TableCell>{m.region?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {m.teachers.map((t) => t.teacher.fullName).join(", ") ||
                      "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {m.managedGroups
                      .map((g) => groupLabel(g.group))
                      .join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    {m.isActive ? (
                      <Badge variant="secondary">Faol</Badge>
                    ) : (
                      <Badge variant="destructive">Bloklangan</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StaffRowActions staff={m} />
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
