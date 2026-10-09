import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon, FileSpreadsheetIcon } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { AddStudentButton } from "@/components/teacher/students/add-student-button";
import { StudentFilters } from "@/components/teacher/students/student-filters";
import { StudentsTable } from "@/components/teacher/students/students-table";
import type { StudentRow } from "@/components/teacher/students/types";
import { buttonVariants } from "@/components/ui/button";
import { requireManager } from "@/lib/auth/guards";
import {
  canAccessGroup,
  getScope,
  groupScopeWhere,
  studentScopeWhere,
} from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { teacherProfileSelect } from "@/lib/students/profile-select";

export const metadata: Metadata = { title: "O'quvchilar" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// Menejer: faqat doiradagi o'quvchilar (CLAUDE.md, menejer doirasi qoidasi).
// Aloqa ma'lumotlari menejerga ko'rinadi, arxiv esa yo'q
export default async function ManagerStudentsPage({
  searchParams,
}: PageProps<"/manager/students">) {
  const manager = await requireManager();
  const scope = await getScope(manager);
  const params = await searchParams;
  const q = param(params.q).slice(0, 100);
  const group = param(params.group);

  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    archivedAt: null,
    ...studentScopeWhere(scope),
  };
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      {
        profile: {
          telegram: { contains: q.replace(/^@/, ""), mode: "insensitive" },
        },
      },
    ];
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 3) {
      where.OR.push(
        { profile: { phone: { contains: digits } } },
        { profile: { parentPhone: { contains: digits } } },
      );
    }
  }
  if (group === "none") where.groupId = null;
  // Doiradan tashqaridagi guruh filtri — bo'sh natija
  else if (group)
    where.groupId = canAccessGroup(scope, group) ? group : { in: [] };

  const [groups, students] = await Promise.all([
    db.group.findMany({
      where: groupScopeWhere(scope),
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
        profile: { select: teacherProfileSelect },
        deletionRequests: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
    }),
  ]);

  const rows: StudentRow[] = students.map(
    ({ group, deletionRequests, ...s }) => ({
      ...s,
      archived: false,
      groupName: group?.name ?? null,
      deletionPending: deletionRequests.length > 0,
    }),
  );
  const exportGroup =
    group && group !== "none" && canAccessGroup(scope, group) ? group : "";

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">O&apos;quvchilar</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={`/api/students/export${exportGroup ? `?groupId=${encodeURIComponent(exportGroup)}` : ""}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <DownloadIcon />
            Excel&apos;ga eksport
          </a>
          {groups.length > 0 && (
            <Link
              href="/manager/students/import"
              className={buttonVariants({ variant: "outline" })}
            >
              <FileSpreadsheetIcon />
              Excel&apos;dan import
            </Link>
          )}
          <AddStudentButton groups={groups} />
        </div>
      </div>

      {groups.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Sizga hali guruh biriktirilmagan. O&apos;qituvchiga murojaat qiling.
        </p>
      )}

      <StudentFilters groups={groups} showArchive={false} />

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          {q || group ? "Hech narsa topilmadi." : "Hali o'quvchi yo'q."}
        </p>
      ) : (
        <StudentsTable rows={rows} groups={groups} variant="manager" />
      )}
    </>
  );
}
