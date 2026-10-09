import type { Metadata } from "next";
import Link from "next/link";
import {
  AddManagerButton,
  ManagerRowActions,
} from "@/components/teacher/managers/manager-controls";
import { RegionsSection } from "@/components/teacher/managers/regions-section";
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

export const metadata: Metadata = { title: "Menejerlar" };

export default async function ManagersPage() {
  await requireTeacher();

  const [managers, regions, groups] = await Promise.all([
    db.user.findMany({
      where: { role: "MANAGER" },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        username: true,
        isActive: true,
        regionId: true,
        region: { select: { name: true } },
        managedGroups: {
          orderBy: { group: { name: "asc" } },
          select: { group: { select: { id: true, name: true } } },
        },
      },
    }),
    db.region.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { groups: true, managers: true } },
      },
    }),
    db.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const regionOptions = regions.map((r) => ({ id: r.id, name: r.name }));

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Menejerlar</h1>
        <AddManagerButton regions={regionOptions} />
      </div>

      <p className="text-muted-foreground text-sm">
        Menejer o&apos;z regionidagi guruhlarni va unga qo&apos;shimcha
        biriktirilgan guruhlarni ko&apos;radi: o&apos;quvchilarni qo&apos;shadi,
        tahrirlaydi, davomat hisobotlarini ko&apos;radi. O&apos;quvchini
        o&apos;chirish uchun so&apos;rov yuboradi. Guruh regionini{" "}
        <Link href="/teacher/groups" className="underline">
          Guruhlar
        </Link>{" "}
        sahifasida tanlang.
      </p>

      {managers.length === 0 ? (
        <p className="text-muted-foreground">Hali menejer yo&apos;q.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>F.I.Sh</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="hidden md:table-cell">
                  Qo&apos;shimcha guruhlar
                </TableHead>
                <TableHead>Holat</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Amallar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managers.map((m) => (
                <TableRow
                  key={m.id}
                  className={m.isActive ? undefined : "text-muted-foreground"}
                >
                  <TableCell className="font-medium">{m.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {m.username}
                  </TableCell>
                  <TableCell>{m.region?.name ?? "—"}</TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {m.managedGroups.map((g) => g.group.name).join(", ") ||
                      "—"}
                  </TableCell>
                  <TableCell>
                    {m.isActive ? (
                      <Badge variant="secondary">Faol</Badge>
                    ) : (
                      <Badge variant="destructive">Bloklangan</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ManagerRowActions
                      regions={regionOptions}
                      groups={groups}
                      manager={{
                        id: m.id,
                        fullName: m.fullName,
                        username: m.username,
                        isActive: m.isActive,
                        regionId: m.regionId,
                        groupIds: m.managedGroups.map((g) => g.group.id),
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

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
