import type { Metadata } from "next";
import Link from "next/link";
import { ParamSelect } from "@/components/common/param-select";
import { TransferButton } from "@/components/teacher/students/transfer-button";
import { Input } from "@/components/ui/input";
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
import { groupLabel } from "@/lib/group-label";
import { studentListWhere } from "@/lib/students/search";

export const metadata: Metadata = { title: "O'quvchilar" };

const LIMIT = 300;

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// ADMIN: barcha o'quvchilar (region, o'qituvchi, guruh bo'yicha), boshqa o'qituvchiga o'tkazish
export default async function AdminStudentsPage({
  searchParams,
}: PageProps<"/admin/students">) {
  await requireAdmin();
  const params = await searchParams;
  const q = param(params.q).slice(0, 100);
  const region = param(params.region);
  const teacher = param(params.teacher);
  const group = param(params.group);

  const groupFilter: Prisma.GroupWhereInput = {
    ...(region ? { regionId: region } : {}),
    ...(teacher ? { teacherId: teacher } : {}),
  };
  const where: Prisma.UserWhereInput = {
    ...studentListWhere({ q, group, archived: false }),
    ...(!group && (region || teacher) ? { group: groupFilter } : {}),
  };
  const [students, total, groups, regions, teachers] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ group: { name: "asc" } }, { fullName: "asc" }],
      take: LIMIT,
      select: {
        id: true,
        fullName: true,
        username: true,
        groupId: true,
        group: {
          select: {
            name: true,
            code: true,
            region: { select: { name: true } },
            teacher: { select: { fullName: true } },
          },
        },
      },
    }),
    db.user.count({ where }),
    db.group.findMany({
      orderBy: { seq: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        teacher: { select: { fullName: true } },
      },
    }),
    getRegionOptions(),
    db.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);
  // O'tkazishda barcha guruhlar — o'qituvchisi bilan (boshqa o'qituvchiga o'tkazish ham)
  const groupOptions = groups.map((g) => ({
    id: g.id,
    name: `${groupLabel(g)} · ${g.teacher.fullName}`,
  }));

  return (
    <>
      <h1 className="text-2xl font-semibold">O&apos;quvchilar</h1>
      <form className="flex flex-wrap gap-2" action="/admin/students">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Ism, login, telefon"
          className="w-56"
          aria-label="Qidiruv"
        />
        {region && <input type="hidden" name="region" value={region} />}
        {teacher && <input type="hidden" name="teacher" value={teacher} />}
        {group && <input type="hidden" name="group" value={group} />}
      </form>
      <div className="flex flex-wrap gap-2">
        <ParamSelect
          name="region"
          value={region}
          label="Region"
          reset={["group"]}
          options={[
            { value: "", label: "Barcha regionlar" },
            ...regions.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
        <ParamSelect
          name="teacher"
          value={teacher}
          label="O'qituvchi"
          reset={["group"]}
          options={[
            { value: "", label: "Barcha o'qituvchilar" },
            ...teachers.map((t) => ({ value: t.id, label: t.fullName })),
          ]}
        />
        <ParamSelect
          name="group"
          value={group}
          label="Guruh"
          options={[
            { value: "", label: "Barcha guruhlar" },
            { value: "none", label: "Guruhsiz" },
            ...groupOptions.map((g) => ({ value: g.id, label: g.name })),
          ]}
        />
      </div>
      <p className="text-muted-foreground text-sm">
        Topildi: {total}
        {total > LIMIT && ` (birinchi ${LIMIT} tasi ko'rsatilgan)`}
      </p>
      {students.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground w-10">№</TableHead>
                <TableHead>F.I.Sh</TableHead>
                <TableHead>Guruh</TableHead>
                <TableHead className="hidden md:table-cell">
                  O&apos;qituvchi
                </TableHead>
                <TableHead className="hidden md:table-cell">Region</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Amallar</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      prefetch={false}
                      href={`/admin/students/${s.id}`}
                      className="font-medium hover:underline"
                    >
                      {s.fullName}
                    </Link>
                    <span className="text-muted-foreground block font-mono text-xs">
                      {s.username}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {s.group ? groupLabel(s.group) : "Guruhsiz"}
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {s.group?.teacher.fullName ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-sm md:table-cell">
                    {s.group?.region?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <TransferButton
                      student={{
                        id: s.id,
                        fullName: s.fullName,
                        groupId: s.groupId,
                      }}
                      groups={groupOptions.filter((g) => g.id !== s.groupId)}
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
