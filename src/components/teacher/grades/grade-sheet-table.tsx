import Link from "next/link";
import { StatusBadge } from "@/components/grades/status-badge";
import {
  categoryText,
  formatPoints,
  signedPoints,
  type PointCategory,
  type SemesterStatus,
} from "@/lib/grades";
import type { StudentSemester } from "@/lib/grades-data";
import { departureLabel } from "@/lib/memberships";
import { cn } from "@/lib/utils";

const COLUMNS: { category: PointCategory; label: string }[] = [
  { category: "HOMEWORK", label: "Uy vazifa" },
  { category: "PRACTICAL", label: "Amaliy" },
  { category: "ORAL", label: "Og'zaki" },
  { category: "BONUS", label: "Bonus" },
];

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
export function GradeSheetTable({ students }: { students: StudentSemester[] }) {
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
            {COLUMNS.map((c) => (
              <th
                key={c.category}
                className="px-2 py-2 text-center font-medium"
              >
                {c.label}
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
                {COLUMNS.map((c) => (
                  <td
                    key={c.category}
                    className="px-2 py-1.5 text-center whitespace-nowrap tabular-nums"
                  >
                    {categoryText(r.categories[c.category])}
                  </td>
                ))}
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
                  {r.categories.EXTRA.earned === 0
                    ? ""
                    : categoryText(r.categories.EXTRA)}
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
