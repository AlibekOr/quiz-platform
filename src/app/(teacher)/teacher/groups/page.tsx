import type { Metadata } from "next";
import Link from "next/link";
import { CreateGroupForm } from "@/components/teacher/groups/create-group-form";
import { GroupRegionSelect } from "@/components/teacher/groups/group-region-select";
import { GroupRowActions } from "@/components/teacher/groups/group-row-actions";
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
import { formatSchedule } from "@/lib/time";

export const metadata: Metadata = { title: "Guruhlar" };

export default async function GroupsPage() {
  await requireTeacher();

  const [groups, regions] = await Promise.all([
    db.group.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        regionId: true,
        _count: {
          select: {
            students: { where: { archivedAt: null } },
            tests: true,
          },
        },
        schedules: {
          select: { weekday: true, startTime: true, endTime: true },
        },
      },
    }),
    db.region.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold">Guruhlar</h1>
      <CreateGroupForm regions={regions} />

      {groups.length === 0 ? (
        <p className="text-muted-foreground">
          Hali guruh yo&apos;q. Birinchi guruhni yarating.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Dars jadvali</TableHead>
                {regions.length > 0 && <TableHead>Region</TableHead>}
                <TableHead className="text-right">O&apos;quvchilar</TableHead>
                <TableHead className="text-right">Testlar</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Amallar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/teacher/groups/${g.id}`}
                      className="hover:underline"
                    >
                      {g.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatSchedule(g.schedules) || "—"}
                  </TableCell>
                  {regions.length > 0 && (
                    <TableCell>
                      <GroupRegionSelect
                        groupId={g.id}
                        groupName={g.name}
                        regionId={g.regionId}
                        regions={regions}
                      />
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Link
                      href={`/teacher/students?group=${g.id}`}
                      className="hover:underline"
                    >
                      {g._count.students}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">{g._count.tests}</TableCell>
                  <TableCell>
                    <GroupRowActions
                      group={{
                        id: g.id,
                        name: g.name,
                        studentCount: g._count.students,
                      }}
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
