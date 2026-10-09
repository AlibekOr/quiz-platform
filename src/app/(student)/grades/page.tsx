import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { requireStudent } from "@/lib/auth/guards";
import {
  cellText,
  formatPoints,
  ITEM_TYPE_LABEL,
  signedPoints,
} from "@/lib/grades";
import { getStudentGrades } from "@/lib/grades-data";
import { formatDate } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Baholarim" };

// O'quvchi faqat o'z baholarini ko'radi: varaq faqat shu o'quvchi bilan quriladi
export default async function MyGradesPage() {
  const student = await requireStudent();
  const periods = await getStudentGrades(student.id);

  return (
    <>
      <h1 className="text-2xl font-semibold">Baholarim</h1>
      {periods.length === 0 ? (
        <p className="text-muted-foreground">Hozircha baholar yo&apos;q.</p>
      ) : (
        periods.map(({ period, sheet }) => {
          const me = sheet.students[0];
          if (!me) return null;
          return (
            <section
              key={period.id}
              className="flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{period.name}</h2>
                  <p className="text-muted-foreground text-sm">
                    {period.group.name} · {formatDate(period.startDate)} –{" "}
                    {formatDate(period.endDate)} · o&apos;tish{" "}
                    {sheet.passPercent}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold tabular-nums">
                    {formatPoints(me.total)}/{formatPoints(me.max)}
                    {me.percent !== null && (
                      <span className="text-muted-foreground text-sm font-normal">
                        {" "}
                        · {me.percent}%
                      </span>
                    )}
                  </span>
                  {me.passed === null ? null : me.passed ? (
                    <Badge variant="secondary">O&apos;tdi</Badge>
                  ) : (
                    <Badge variant="destructive">O&apos;tmadi</Badge>
                  )}
                </div>
              </div>

              {sheet.items.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Hali vazifa yoki test yo&apos;q.
                </p>
              ) : (
                <ul className="flex flex-col divide-y text-sm">
                  {sheet.items.map((item, j) => {
                    const c = me.cells[j];
                    return (
                      <li
                        key={`${item.type}:${item.id}`}
                        className="flex items-center justify-between gap-3 py-2"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-muted-foreground text-xs">
                            {ITEM_TYPE_LABEL[item.type]}
                            {item.dueDate &&
                              ` · muddat ${formatDate(item.dueDate)}`}
                            {c.kind === "points" && c.note && ` · ${c.note}`}
                            {c.kind === "exempt" && ` · ozod: ${c.reason}`}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 tabular-nums",
                            c.kind === "points" &&
                              c.missing &&
                              "text-red-600 dark:text-red-400",
                          )}
                        >
                          {c.kind === "pending" ? (
                            <span className="text-muted-foreground">
                              kutilmoqda
                            </span>
                          ) : (
                            <>
                              {cellText(c)}
                              {c.kind === "points" && `/${item.maxPoints}`}
                            </>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {me.adjustments.length > 0 && (
                <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
                  {me.adjustments.map((a, i) => (
                    <li key={i}>
                      Tuzatish {signedPoints(a.points)}: {a.reason}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })
      )}
    </>
  );
}
