import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon, FileSpreadsheetIcon } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { AddStudentButton } from "@/components/teacher/students/add-student-button";
import { StudentFilters } from "@/components/teacher/students/student-filters";
import { StudentsTable } from "@/components/teacher/students/students-table";
import type { StudentRow } from "@/components/teacher/students/types";
import { buttonVariants } from "@/components/ui/button";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { teacherProfileSelect } from "@/lib/students/profile-select";

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

  const archived = group === "archived";
  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    archivedAt: archived ? { not: null } : null,
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
    // Telefonlar +998XXXXXXXXX ko'rinishida saqlanadi: "90 123" -> "90123"
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 3) {
      where.OR.push(
        { profile: { phone: { contains: digits } } },
        { profile: { parentPhone: { contains: digits } } },
      );
    }
  }
  if (group === "none") where.groupId = null;
  else if (group && !archived) where.groupId = group;

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
        archivedAt: true,
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
    ({ group, archivedAt, deletionRequests, ...s }) => ({
      ...s,
      archived: archivedAt !== null,
      groupName: group?.name ?? null,
      deletionPending: deletionRequests.length > 0,
    }),
  );

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">O&apos;quvchilar</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Eksport joriy guruh filtri bo'yicha (filtr bo'lmasa — hammasi) */}
          <a
            href={`/api/students/export${group && group !== "none" && !archived ? `?groupId=${encodeURIComponent(group)}` : ""}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <DownloadIcon />
            Excel&apos;ga eksport
          </a>
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
          {archived
            ? "Arxiv bo'sh."
            : q || group
              ? "Hech narsa topilmadi."
              : "Hali o'quvchi yo'q."}
        </p>
      ) : (
        <StudentsTable rows={rows} groups={groups} />
      )}
    </>
  );
}
