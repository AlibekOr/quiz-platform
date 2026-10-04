import type { Metadata } from "next";
import Link from "next/link";
import { FileSpreadsheetIcon } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { AddStudentButton } from "@/components/teacher/students/add-student-button";
import { StudentFilters } from "@/components/teacher/students/student-filters";
import { StudentRowActions } from "@/components/teacher/students/student-row-actions";
import type { StudentRow } from "@/components/teacher/students/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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

export const metadata: Metadata = { title: "O'quvchilar" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function StudentsPage({
  searchParams,
}: PageProps<"/teacher/students">) {
  await requireTeacher();
  const params = await searchParams;
  const q = param(params.q).slice(0, 100);
  const group = param(params.group);

  const where: Prisma.UserWhereInput = { role: "STUDENT" };
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
    ];
  }
  if (group === "none") where.groupId = null;
  else if (group) where.groupId = group;

  const [groups, students] = await Promise.all([
    db.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.user.findMany({
      where,
      orderBy: [{ group: { name: "asc" } }, { fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
        username: true,
        isActive: true,
        groupId: true,
        group: { select: { name: true } },
      },
    }),
  ]);

  const rows: StudentRow[] = students.map(({ group, ...s }) => ({
    ...s,
    groupName: group?.name ?? null,
  }));

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">O&apos;quvchilar</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/teacher/students/import"
            className={buttonVariants({ variant: "outline" })}
          >
            <FileSpreadsheetIcon />
            Excel&apos;dan import
          </Link>
          <AddStudentButton groups={groups} />
        </div>
      </div>

      {groups.length === 0 && (
        <p className="text-muted-foreground text-sm">
          O&apos;quvchi qo&apos;shishdan oldin{" "}
          <Link href="/teacher/groups" className="underline">
            guruh yarating
          </Link>
          .
        </p>
      )}

      <StudentFilters groups={groups} />

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          {q || group ? "Hech narsa topilmadi." : "Hali o'quvchi yo'q."}
        </p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">Jami: {rows.length}</p>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>F.I.Sh</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Guruh</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Amallar</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow
                    key={s.id}
                    className={s.isActive ? undefined : "text-muted-foreground"}
                  >
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {s.username}
                    </TableCell>
                    <TableCell>{s.groupName ?? "—"}</TableCell>
                    <TableCell>
                      {s.isActive ? (
                        <Badge variant="secondary">Faol</Badge>
                      ) : (
                        <Badge variant="destructive">Bloklangan</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StudentRowActions student={s} groups={groups} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
