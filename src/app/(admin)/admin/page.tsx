import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import { ParamSelect } from "@/components/common/param-select";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/guards";
import { getTeacherStats, STATS_COLUMNS } from "@/lib/admin-stats";
import { getRegionOptions } from "@/lib/cached-data";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Statistika" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// ADMIN bosh sahifasi: markaz statistikasi, region va o'qituvchi bo'yicha, Excel
export default async function AdminHomePage({
  searchParams,
}: PageProps<"/admin">) {
  await requireAdmin();
  const params = await searchParams;
  const region = param(params.region);
  const teacher = param(params.teacher);

  const [regions, teacherOptions, counts, rows] = await Promise.all([
    getRegionOptions(),
    db.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    Promise.all([
      db.region.count(),
      db.user.count({ where: { role: "TEACHER", isActive: true } }),
      db.group.count(),
      db.user.count({ where: { role: "STUDENT", archivedAt: null } }),
      db.group.count({ where: { regionId: null } }),
    ]),
    getTeacherStats({ regionId: region || null, teacherId: teacher || null }),
  ]);
  const [regionCount, teacherCount, groupCount, studentCount, regionless] =
    counts;
  const query = new URLSearchParams({
    ...(region ? { region } : {}),
    ...(teacher ? { teacher } : {}),
  });

  const tiles = [
    { label: "Regionlar", value: regionCount },
    { label: "O'qituvchilar", value: teacherCount },
    { label: "Guruhlar", value: groupCount },
    { label: "O'quvchilar", value: studentCount },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold">Statistika</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">{t.label}</p>
            <p className="text-2xl font-semibold tabular-nums">{t.value}</p>
          </div>
        ))}
      </div>
      {regionless > 0 && (
        <p className="text-sm">
          Regionsiz guruhlar: {regionless} —{" "}
          <Link
            prefetch={false}
            href="/admin/groups?region=none"
            className="underline"
          >
            region bering
          </Link>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <ParamSelect
          name="region"
          value={region}
          label="Region"
          options={[
            { value: "", label: "Barcha regionlar" },
            ...regions.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
        <ParamSelect
          name="teacher"
          value={teacher}
          label="O'qituvchi"
          options={[
            { value: "", label: "Barcha o'qituvchilar" },
            ...teacherOptions.map((t) => ({ value: t.id, label: t.fullName })),
          ]}
        />
        <a
          href={`/api/admin/stats${query.size ? `?${query}` : ""}`}
          className={buttonVariants({ variant: "outline" })}
        >
          <DownloadIcon />
          Excel
        </a>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">O&apos;qituvchi topilmadi.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {STATS_COLUMNS.map((c) => (
                  <TableHead key={c} className="whitespace-nowrap">
                    {c}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.fullName}</TableCell>
                  <TableCell className="text-sm">{r.regions || "—"}</TableCell>
                  <TableCell className="tabular-nums">{r.groups}</TableCell>
                  <TableCell className="tabular-nums">{r.students}</TableCell>
                  <TableCell className="tabular-nums">
                    {r.attendance === null ? "—" : `${r.attendance}%`}
                  </TableCell>
                  <TableCell className="tabular-nums">{r.passing}</TableCell>
                  <TableCell className="tabular-nums">
                    {r.extraChance}
                  </TableCell>
                  <TableCell className="text-destructive tabular-nums">
                    {r.failing}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {r.missingHomework}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {r.atRisk > 0 ? (
                      <Link
                        prefetch={false}
                        href={`/admin/risk?teacher=${r.id}`}
                        className="text-destructive font-medium hover:underline"
                      >
                        {r.atRisk}
                      </Link>
                    ) : (
                      0
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        O&apos;tayotgan / qo&apos;shimcha imkoniyat / yiqilayotgan — joriy
        semestrdagi hozirgi jami bo&apos;yicha. Davomat — oxirgi 30 kun.
      </p>
    </>
  );
}
