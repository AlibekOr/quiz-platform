import type { Metadata } from "next";
import Link from "next/link";
import { ParamSelect } from "@/components/common/param-select";
import { RiskList } from "@/components/risk/risk-list";
import { canAccessGroup, groupScopeWhere } from "@/lib/auth/scope";
import { requireTeacherScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { groupLabel } from "@/lib/group-label";
import { getRiskRows } from "@/lib/risk-data";

export const metadata: Metadata = { title: "Xavf ostidagi o'quvchilar" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// To'liq ro'yxat: guruh va daraja filtrlari (FEATURES.md, A qism)
export default async function RiskPage({
  searchParams,
}: PageProps<"/teacher/risk">) {
  const { scope } = await requireTeacherScope();
  const params = await searchParams;
  const group = param(params.group);
  const level = param(params.level);
  const groupId = group && canAccessGroup(scope, group) ? group : null;

  const [rows, groups] = await Promise.all([
    getRiskRows(scope, { forManager: false, groupId }),
    db.group.findMany({
      where: groupScopeWhere(scope),
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
  ]);
  const shown = level ? rows.filter((r) => r.risk.level === level) : rows;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          Xavf ostidagi o&apos;quvchilar
        </h1>
        <p className="text-muted-foreground text-sm">
          Joriy semestr bo&apos;yicha: ketma-ket qoldirish, past davomat,
          topshirilmagan vazifalar, ball sur&apos;ati va jarimalar.{" "}
          <Link
            prefetch={false}
            href="/teacher/risk/settings"
            className="underline"
          >
            Sozlamalar
          </Link>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ParamSelect
          name="group"
          value={groupId ?? ""}
          label="Guruh"
          options={[
            { value: "", label: "Barcha guruhlar" },
            ...groups.map((g) => ({ value: g.id, label: groupLabel(g) })),
          ]}
        />
        <ParamSelect
          name="level"
          value={level}
          label="Daraja"
          options={[
            { value: "", label: "Barcha darajalar" },
            { value: "HIGH", label: "Yuqori" },
            { value: "MEDIUM", label: "O'rta" },
          ]}
        />
      </div>
      <RiskList rows={shown} studentHref="/teacher/students" />
    </>
  );
}
