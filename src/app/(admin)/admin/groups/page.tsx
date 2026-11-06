import type { Metadata } from "next";
import Link from "next/link";
import { GroupRegionAdminSelect } from "@/components/admin/admin-controls";
import { ParamSelect } from "@/components/common/param-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth/guards";
import { getRegionOptions } from "@/lib/cached-data";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Guruhlar" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// ADMIN: barcha guruhlar, region va o'qituvchi bo'yicha filtr; regionsiz guruhlarga region
export default async function AdminGroupsPage({
  searchParams,
}: PageProps<"/admin/groups">) {
  await requireAdmin();
  const params = await searchParams;
  const region = param(params.region);
  const teacher = param(params.teacher);

  const where: Prisma.GroupWhereInput = {
    ...(region === "none"
      ? { regionId: null }
      : region
        ? { regionId: region }
        : {}),
    ...(teacher ? { teacherId: teacher } : {}),
  };
  const [groups, regions, teachers] = await Promise.all([
    db.group.findMany({
      where,
      orderBy: [{ regionId: { sort: "asc", nulls: "first" } }, { seq: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        regionId: true,
        teacher: {
          select: {
            fullName: true,
            teacherRegions: {
              select: { region: { select: { id: true, name: true } } },
            },
          },
        },
        _count: { select: { students: { where: { archivedAt: null } } } },
      },
    }),
    getRegionOptions(),
    db.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);
  const regionless = groups.filter((g) => g.regionId === null).length;

  return (
    <>
      <h1 className="text-2xl font-semibold">Guruhlar</h1>
      {regionless > 0 && region !== "none" && (
        <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
          Regionsiz guruhlar: {regionless}. Ular faqat o&apos;qituvchisiga
          ko&apos;rinadi. Regionni guruh o&apos;qituvchisining regionlaridan
          tanlang (kerak bo&apos;lsa, avval{" "}
          <Link prefetch={false} href="/admin/teachers" className="underline">
            o&apos;qituvchiga region qo&apos;shing
          </Link>
          ). Guruh kodi o&apos;zgarmaydi.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <ParamSelect
          name="region"
          value={region}
          label="Region"
          options={[
            { value: "", label: "Barcha regionlar" },
            { value: "none", label: "Regionsiz" },
            ...regions.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
        <ParamSelect
          name="teacher"
          value={teacher}
          label="O'qituvchi"
          options={[
            { value: "", label: "Barcha o'qituvchilar" },
            ...teachers.map((t) => ({ value: t.id, label: t.fullName })),
          ]}
        />
      </div>
      {groups.length === 0 ? (
        <p className="text-muted-foreground">Guruh topilmadi.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground w-10">№</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Kod</TableHead>
                <TableHead>O&apos;qituvchi</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">O&apos;quvchilar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g, i) => (
                <TableRow key={g.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      prefetch={false}
                      href={`/admin/groups/${g.id}`}
                      className="hover:underline"
                    >
                      {g.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {g.code ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {g.teacher.fullName}
                  </TableCell>
                  <TableCell>
                    <GroupRegionAdminSelect
                      groupId={g.id}
                      groupName={g.name}
                      regionId={g.regionId}
                      regions={g.teacher.teacherRegions.map((r) => r.region)}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {g._count.students}
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
