import type { Metadata } from "next";
import { StudentFilters } from "@/components/teacher/students/student-filters";
import { StudentsTable } from "@/components/teacher/students/students-table";
import type { StudentRow } from "@/components/teacher/students/types";
import { groupScopeWhere, studentScopeWhere } from "@/lib/auth/scope";
import { requireTeacherScope } from "@/lib/auth/staff";
import { groupLabel } from "@/lib/group-label";
import { db } from "@/lib/db";
import { teacherProfileSelect } from "@/lib/students/profile-select";
import { studentListWhere } from "@/lib/students/search";

export const metadata: Metadata = { title: "Arxiv" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Arxivlangan o'quvchilar (Sozlamalar): tiklash yoki butunlay o'chirish */
export default async function ArchivePage({
  searchParams,
}: PageProps<"/teacher/archive">) {
  const { scope } = await requireTeacherScope();
  const params = await searchParams;
  const q = param(params.q).slice(0, 100);
  const group = param(params.group);

  const [groupRows, students] = await Promise.all([
    db.group.findMany({
      where: groupScopeWhere(scope),
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    db.user.findMany({
      where: {
        ...studentListWhere({ q, group, archived: true }),
        ...studentScopeWhere(scope),
      },
      orderBy: [{ archivedAt: "desc" }, { fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
        username: true,
        isActive: true,
        groupId: true,
        group: { select: { name: true, code: true } },
        profile: { select: teacherProfileSelect },
      },
    }),
  ]);
  const groups = groupRows.map((g) => ({ id: g.id, name: groupLabel(g) }));

  const rows: StudentRow[] = students.map(({ group, ...s }) => ({
    ...s,
    archived: true,
    groupName: group ? groupLabel(group) : null,
  }));

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Arxiv</h1>
        <p className="text-muted-foreground text-sm">
          Arxivlangan o&apos;quvchilar tizimga kira olmaydi va ro&apos;yxatlarda
          ko&apos;rinmaydi. Tiklansa, ma&apos;lumotlari bilan qaytadi.
        </p>
      </div>

      <StudentFilters groups={groups} />

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          {q || group ? "Hech narsa topilmadi." : "Arxiv bo'sh."}
        </p>
      ) : (
        <StudentsTable rows={rows} groups={groups} />
      )}
    </>
  );
}
