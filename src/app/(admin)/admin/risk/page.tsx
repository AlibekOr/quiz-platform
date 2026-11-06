import type { Metadata } from "next";
import { ParamSelect } from "@/components/common/param-select";
import { RiskList } from "@/components/risk/risk-list";
import type { Scope } from "@/lib/auth/scope";
import { requireAdminScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { getRiskRows } from "@/lib/risk-data";

export const metadata: Metadata = { title: "Xavf ostidagi o'quvchilar" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// ADMIN: o'qituvchi bo'yicha xavf ostidagi o'quvchilar (statistikadagi sondan keladi)
export default async function AdminRiskPage({
  searchParams,
}: PageProps<"/admin/risk">) {
  await requireAdminScope();
  const params = await searchParams;
  const teachers = await db.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      taughtGroups: { select: { id: true } },
    },
  });
  const teacher = teachers.find((t) => t.id === param(params.teacher));
  // O'qituvchi tanlanmasa — barcha guruhlar
  const scope: Scope = teacher
    ? {
        kind: "limited",
        userId: teacher.id,
        role: "TEACHER",
        groupIds: teacher.taughtGroups.map((g) => g.id),
        creatorIds: [teacher.id],
      }
    : { kind: "all" };
  const rows = await getRiskRows(scope, { forManager: false });

  return (
    <>
      <h1 className="text-2xl font-semibold">
        Xavf ostidagi o&apos;quvchilar
      </h1>
      <div className="flex flex-wrap gap-2">
        <ParamSelect
          name="teacher"
          value={teacher?.id ?? ""}
          label="O'qituvchi"
          options={[
            { value: "", label: "Barcha o'qituvchilar" },
            ...teachers.map((t) => ({ value: t.id, label: t.fullName })),
          ]}
        />
      </div>
      <RiskList rows={rows} studentHref="/admin/students" />
    </>
  );
}
