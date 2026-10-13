import Link from "next/link";
import { CATEGORY_LABEL, formatPoints } from "@/lib/grades";
import type { SemesterGrades } from "@/lib/grades-data";
import { homeworkStatus } from "@/lib/homework";
import { departureLabel } from "@/lib/memberships";
import { formatDayMonth, type DateStr } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * Guruh bo'yicha umumiy ko'rinish: o'quvchilar × topshiriqlar (EXTRA'siz).
 * Bajarilmagan (0 yoki muddati o'tib ballsiz) — qizil, kutilmoqda — bo'sh
 */
export function HomeworkMatrix({
  data,
  today,
}: {
  data: SemesterGrades;
  today: DateStr;
}) {
  const items = data.assignments.filter((a) => a.category !== "EXTRA");
  if (items.length === 0)
    return (
      <p className="text-muted-foreground">
        Bu semestrda hali topshiriq yo&apos;q.
      </p>
    );
  if (data.students.length === 0)
    return (
      <p className="text-muted-foreground">
        Bu semestrda guruhda o&apos;quvchi bo&apos;lmagan.
      </p>
    );

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted border-b">
              <th className="bg-muted sticky left-0 z-10 px-3 py-2 text-left font-medium">
                O&apos;quvchi
              </th>
              {items.map((a) => (
                <th
                  key={a.id}
                  className="min-w-16 px-1.5 py-2 text-center align-top font-medium"
                >
                  <span className="text-muted-foreground block text-xs font-normal">
                    {CATEGORY_LABEL[a.category]}
                  </span>
                  <Link
                    href={`/teacher/homework/${a.id}`}
                    className="hover:underline"
                    title={a.title}
                  >
                    {formatDayMonth(a.dueDate)}
                  </Link>
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium">Bajarmagan</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s, i) => {
              const cells = items.map((a) => {
                const points = s.grades[a.id]?.points ?? null;
                return {
                  id: a.id,
                  points,
                  status: homeworkStatus(points, a.dueDate, today),
                };
              });
              const missed = cells.filter((c) => c.status === "MISSED").length;
              return (
                <tr
                  key={s.id}
                  className={cn(
                    "border-b",
                    s.departure && "text-muted-foreground",
                  )}
                >
                  <td className="bg-background sticky left-0 z-10 px-3 py-1.5 whitespace-nowrap">
                    <span className="text-muted-foreground mr-1.5 tabular-nums">
                      {i + 1}.
                    </span>
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
                  {cells.map((c) => (
                    <td
                      key={c.id}
                      className={cn(
                        "px-1.5 py-1.5 text-center tabular-nums",
                        c.status === "MISSED" &&
                          "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
                      )}
                    >
                      {c.points === null
                        ? c.status === "MISSED"
                          ? "—"
                          : ""
                        : formatPoints(c.points)}
                    </td>
                  ))}
                  <td
                    className={cn(
                      "px-2 py-1.5 text-center tabular-nums",
                      missed > 0 && "text-destructive font-medium",
                    )}
                  >
                    {missed}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground text-xs">
        Qizil — bajarilmagan (0 ball yoki muddati o&apos;tib ball
        qo&apos;yilmagan) · bo&apos;sh — muddati hali o&apos;tmagan. Sana ustiga
        bosilsa ball qo&apos;yish sahifasi ochiladi.
      </p>
    </>
  );
}
