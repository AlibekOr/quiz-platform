import Link from "next/link";
import { StatusBadge } from "@/components/grades/status-badge";
import {
  categoryText,
  formatPoints,
  signedPoints,
  type CategoryRule,
  type SemesterStatus,
} from "@/lib/grades";
import type { StudentSemester } from "@/lib/grades-data";
import { departureLabel } from "@/lib/memberships";
import { cn } from "@/lib/utils";

/** "Yiqildi" va "Qo'shimcha imkoniyat" tepada, keyin qolganlar (ichida mavjud tartib) */
const STATUS_ORDER: Record<SemesterStatus, number> = {
  FAILED: 0,
  EXTRA_CHANCE: 1,
  IN_PROGRESS: 2,
  PASSED: 2,
};

const ROW_CLASS: Partial<Record<SemesterStatus, string>> = {
  EXTRA_CHANCE: "bg-amber-500/5",
  FAILED: "bg-destructive/5",
};

/** O'qituvchi uchun semestr jadvali: o'quvchilar × kategoriyalar, jami va holat */
export function GradeSheetTable({
  students,
  categories,
}: {
  students: StudentSemester[];
  /** Semestr kategoriyalari (qo'shimcha — alohida ustunda) */
  categories: CategoryRule[];
}) {
  const columns = categories.filter((c) => c.kind !== "EXTRA");
  const extraIds = new Set(
    categories.filter((c) => c.kind === "EXTRA").map((c) => c.id),
  );
  const rows = [...students].sort(
    (a, b) => STATUS_ORDER[a.result.status] - STATUS_ORDER[b.result.status],
  );
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted border-b">
            <th className="bg-muted sticky left-0 z-10 px-3 py-2 text-left font-medium">
              O&apos;quvchi
            </th>
            {columns.map((c) => (
              <th key={c.id} className="px-2 py-2 text-center font-medium">
                {c.name}
              </th>
            ))}
            <th className="px-2 py-2 text-center font-medium">Tuzatish</th>
            <th className="px-2 py-2 text-center font-medium">
              Qo&apos;shimcha
            </th>
            <th className="px-2 py-2 text-center font-medium">Jarima</th>
            <th className="px-2 py-2 text-center font-medium">Jami</th>
            <th className="px-2 py-2 text-center font-medium">Holat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => {
            const r = s.result;
            const byId = new Map(r.categories.map((c) => [c.id, c]));
            const extra = r.categories.filter((c) => extraIds.has(c.id));
            const extraEarned = extra.reduce((sum, c) => sum + c.earned, 0);
            return (
              <tr
                key={s.id}
                className={cn(
                  "border-b",
                  ROW_CLASS[r.status],
                  s.departure && "text-muted-foreground",
                )}
              >
                <td className="bg-background sticky left-0 z-10 px-3 py-1.5 whitespace-nowrap">
                  <span className="text-muted-foreground mr-1.5 tabular-nums">
                    {i + 1}.
                  </span>
                  <Link
                    prefetch={false}
                    href={`/teacher/students/${s.id}`}
                    className="hover:underline"
                  >
                    {s.fullName}
                  </Link>
                  {s.departure && (
                    <span className="block text-xs italic">
                      {departureLabel(s.departure)}
                    </span>
                  )}
                </td>
                {columns.map((c) => {
                  const result = byId.get(c.id);
                  return (
                    <td
                      key={c.id}
                      className="px-2 py-1.5 text-center whitespace-nowrap tabular-nums"
                    >
                      {result ? categoryText(result) : ""}
                    </td>
                  );
                })}
                <td
                  className="px-2 py-1.5 text-center tabular-nums"
                  title={
                    s.adjustments
                      .map((a) => `${signedPoints(a.points)}: ${a.reason}`)
                      .join("\n") || undefined
                  }
                >
                  {r.adjustments === 0 ? "" : signedPoints(r.adjustments)}
                </td>
                <td className="px-2 py-1.5 text-center whitespace-nowrap tabular-nums">
                  {extraEarned === 0
                    ? ""
                    : extra.length === 1
                      ? categoryText(extra[0])
                      : formatPoints(extraEarned)}
                </td>
                <td className="text-destructive px-2 py-1.5 text-center tabular-nums">
                  {r.penalties === 0 ? "" : `−${formatPoints(r.penalties)}`}
                </td>
                <td className="px-2 py-1.5 text-center font-semibold whitespace-nowrap tabular-nums">
                  {formatPoints(r.total)}
                  <span className="text-muted-foreground font-normal">
                    /{r.maxTotal}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-center">
                  <StatusBadge status={r.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
