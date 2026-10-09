import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  cellText,
  formatPoints,
  ITEM_TYPE_LABEL,
  signedPoints,
  type GradeSheet,
} from "@/lib/grades";
import { departureLabel } from "@/lib/memberships";
import { formatDayMonth } from "@/lib/time";
import { cn } from "@/lib/utils";

/** O'qituvchi uchun davr varag'i: o'quvchilar × itemlar, tuzatish, jami, foiz, holat */
export function GradeSheetTable({ sheet }: { sheet: GradeSheet }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted border-b">
            <th className="bg-muted sticky left-0 z-10 px-3 py-2 text-left font-medium">
              O&apos;quvchi
            </th>
            {sheet.items.map((i) => (
              <th
                key={`${i.type}:${i.id}`}
                className="min-w-20 px-2 py-2 text-center align-top font-medium"
              >
                <span className="text-muted-foreground block text-xs font-normal">
                  {ITEM_TYPE_LABEL[i.type]}
                  {i.dueDate && ` · ${formatDayMonth(i.dueDate)}`}
                </span>
                <Link
                  href={
                    i.type === "HOMEWORK"
                      ? `/teacher/homework/${i.id}`
                      : `/teacher/tests/${i.id}`
                  }
                  className="line-clamp-2 hover:underline"
                >
                  {i.title}
                </Link>
                <span className="text-muted-foreground block text-xs font-normal">
                  /{i.maxPoints}
                </span>
              </th>
            ))}
            <th className="px-2 py-2 text-center font-medium">Tuzatish</th>
            <th className="px-2 py-2 text-center font-medium">Jami</th>
            <th className="px-2 py-2 text-center font-medium">Foiz</th>
            <th className="px-2 py-2 text-center font-medium">Holat</th>
          </tr>
        </thead>
        <tbody>
          {sheet.students.map((s) => (
            <tr
              key={s.id}
              className={cn("border-b", s.departure && "text-muted-foreground")}
            >
              <td className="bg-background sticky left-0 z-10 px-3 py-1.5 whitespace-nowrap">
                <Link
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
              {s.cells.map((c, j) => (
                <td
                  key={`${sheet.items[j].type}:${sheet.items[j].id}`}
                  title={
                    c.kind === "exempt"
                      ? `Ozod: ${c.reason}`
                      : c.kind === "pending"
                        ? "Muddati hali o'tmagan"
                        : c.missing
                          ? "Muddati o'tgan, baholanmagan"
                          : (c.note ?? undefined)
                  }
                  className={cn(
                    "px-2 py-1.5 text-center tabular-nums",
                    c.kind === "exempt" && "bg-muted text-muted-foreground",
                    c.kind === "points" &&
                      c.missing &&
                      "bg-red-500/10 text-red-700 dark:text-red-400",
                  )}
                >
                  {cellText(c)}
                  {c.kind === "points" && c.note && "*"}
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
                {s.adjustment === 0 ? "" : signedPoints(s.adjustment)}
              </td>
              <td className="px-2 py-1.5 text-center font-semibold tabular-nums">
                {formatPoints(s.total)}
                <span className="text-muted-foreground font-normal">
                  /{formatPoints(s.max)}
                </span>
              </td>
              <td className="px-2 py-1.5 text-center tabular-nums">
                {s.percent === null ? "—" : `${s.percent}%`}
              </td>
              <td className="px-2 py-1.5 text-center">
                {s.passed === null ? (
                  "—"
                ) : s.passed ? (
                  <Badge variant="secondary">O&apos;tdi</Badge>
                ) : (
                  <Badge variant="destructive">O&apos;tmadi</Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
