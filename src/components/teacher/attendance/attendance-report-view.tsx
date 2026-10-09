import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";
import {
  isPresent,
  MARK_LABEL,
  MARK_SYMBOL,
  mostAbsent,
  type AttendanceReport,
} from "@/lib/attendance";
import { departureLabel } from "@/lib/memberships";
import { formatDayMonth } from "@/lib/time";
import { cn } from "@/lib/utils";

const CELL_CLASS = {
  PRESENT: "",
  ABSENT: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  LATE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
} as const;

/** Oylik davomat hisoboti jadvali (o'qituvchi va menejer). studentHref null — havolasiz */
export function AttendanceReportView({
  report,
  studentHref,
}: {
  report: AttendanceReport;
  studentHref: ((id: string) => string) | null;
}) {
  const worst = mostAbsent(report);
  const marks = report.students.flatMap((s) =>
    s.cells.flatMap((c) => (c ? [c.status] : [])),
  );
  const totalMarks = marks.length;
  const totalPresent = marks.filter(isPresent).length;
  const hasOutside = report.students.some((s) => s.member.some((m) => !m));
  const name = (s: { id: string; fullName: string }) =>
    studentHref ? (
      <Link href={studentHref(s.id)} className="hover:underline">
        {s.fullName}
      </Link>
    ) : (
      s.fullName
    );

  return (
    <>
      {report.dates.length === 0 ? (
        <p className="text-muted-foreground">Bu oyda davomat belgilanmagan.</p>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Darslar: {report.dates.length} · O&apos;rtacha davomat:{" "}
            <b className="text-foreground">
              {totalMarks ? Math.round((totalPresent / totalMarks) * 100) : 0}%
            </b>
          </p>

          {worst.length > 0 && (
            <section className="flex flex-col gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <TriangleAlertIcon className="size-4 text-amber-600" />
                Eng ko&apos;p dars qoldirganlar
              </h2>
              <ul className="flex flex-col gap-1 text-sm">
                {worst.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2">
                    {name(s)}
                    <span className="tabular-nums">
                      {s.stats.absent} ta qoldirgan · {s.stats.percent}%
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="bg-muted sticky left-0 z-10 px-3 py-2 text-left font-medium">
                    O&apos;quvchi
                  </th>
                  {report.dates.map((d) => (
                    <th
                      key={d}
                      className="px-1.5 py-2 text-center font-medium tabular-nums"
                    >
                      {formatDayMonth(d)}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-right font-medium">Keldi</th>
                  <th className="px-2 py-2 text-right font-medium">Kelmadi</th>
                  <th className="px-3 py-2 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {report.students.map((s) => (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-b",
                      s.departure && "text-muted-foreground",
                    )}
                  >
                    <td className="bg-background sticky left-0 z-10 px-3 py-1.5 whitespace-nowrap">
                      {name(s)}
                      {s.departure && (
                        <span className="block text-xs italic">
                          {departureLabel(s.departure)}
                        </span>
                      )}
                    </td>
                    {s.cells.map((c, j) => (
                      <td
                        key={report.dates[j]}
                        title={
                          c
                            ? `${MARK_LABEL[c.status]}${c.note ? `: ${c.note}` : ""}`
                            : s.member[j]
                              ? undefined
                              : "Bu kuni guruhda emas edi"
                        }
                        className={cn(
                          "px-1.5 py-1.5 text-center font-medium",
                          !s.member[j] && "bg-muted",
                          c && CELL_CLASS[c.status],
                        )}
                      >
                        {c ? MARK_SYMBOL[c.status] : ""}
                        {c?.note && <sup aria-hidden>*</sup>}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {s.stats.present}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums">
                      {s.stats.absent}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-1.5 text-right font-medium tabular-nums",
                        s.stats.percent !== null &&
                          s.stats.percent < 70 &&
                          "text-destructive",
                      )}
                    >
                      {s.stats.percent === null ? "—" : `${s.stats.percent}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-medium">
                  <td className="bg-muted sticky left-0 z-10 px-3 py-2">
                    Kelganlar
                  </td>
                  {report.presentPerLesson.map((n, j) => (
                    <td
                      key={report.dates[j]}
                      className="px-1.5 py-2 text-center tabular-nums"
                    >
                      {n}
                    </td>
                  ))}
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-muted-foreground text-xs">
            + keldi · − kelmadi · K kechikdi (keldi hisoblanadi) · * izoh bor
            (ustiga olib boring)
            {hasOutside &&
              " · kulrang — o'quvchi o'sha kuni bu guruhda bo'lmagan"}
          </p>
        </>
      )}
    </>
  );
}
