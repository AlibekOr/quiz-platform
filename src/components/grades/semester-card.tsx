import {
  CATEGORY_LABEL,
  categoryText,
  formatPoints,
  signedPoints,
  type PointCategory,
} from "@/lib/grades";
import type { SemesterGrades, StudentSemester } from "@/lib/grades-data";
import { formatDate } from "@/lib/time";
import { StatusBadge } from "./status-badge";

const BREAKDOWN: PointCategory[] = [
  "HOMEWORK",
  "PRACTICAL",
  "ORAL",
  "BONUS",
  "EXTRA",
];

/**
 * Bitta o'quvchining bitta semestri: jami, holat, kategoriyalar ("yig'ilgan / chegara"),
 * topshiriqlar bo'yicha ballar va tuzatishlar. O'quvchi sahifasi va o'qituvchi kartochkasi
 */
export function SemesterCard({
  data,
  student,
}: {
  data: SemesterGrades;
  student: StudentSemester;
}) {
  const { semester, assignments } = data;
  const r = student.result;
  const oralSum = student.oral.reduce((s, o) => s + o.points, 0);

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{semester.name}</h2>
          <p className="text-muted-foreground text-sm">
            {semester.group.name} · {formatDate(semester.startDate)} –{" "}
            {formatDate(semester.endDate)} · o&apos;tish {r.passScore}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tabular-nums">
            {formatPoints(r.total)}
            <span className="text-muted-foreground text-sm font-normal">
              /{r.maxTotal}
            </span>
          </span>
          <StatusBadge status={r.status} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {BREAKDOWN.filter(
          (c) => c !== "EXTRA" || r.categories.EXTRA.earned > 0,
        ).map((c) => (
          <div key={c} className="bg-muted/50 rounded-md px-3 py-2">
            <dt className="text-muted-foreground text-xs">
              {CATEGORY_LABEL[c]}
            </dt>
            <dd className="font-medium tabular-nums">
              {categoryText(r.categories[c])}
            </dd>
          </div>
        ))}
        {r.penalties > 0 && (
          <div className="bg-destructive/10 rounded-md px-3 py-2">
            <dt className="text-muted-foreground text-xs">Jarimalar</dt>
            <dd className="text-destructive font-medium tabular-nums">
              −{formatPoints(r.penalties)}
            </dd>
          </div>
        )}
      </dl>

      {assignments.length > 0 && (
        <ul className="flex flex-col divide-y text-sm">
          {assignments.map((a) => {
            const g = student.grades[a.id];
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted-foreground text-xs">
                    {CATEGORY_LABEL[a.category]} · muddat{" "}
                    {formatDate(a.dueDate)}
                    {g?.note && ` · ${g.note}`}
                  </span>
                </div>
                <span className="shrink-0 tabular-nums">
                  {g ? (
                    `${formatPoints(g.points)}/${a.maxPoints}`
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {student.oral.length > 0 && (
        <p className="text-muted-foreground text-sm">
          Og&apos;zaki: {student.oral.length} ta darsda, {formatPoints(oralSum)}{" "}
          ball
        </p>
      )}

      {student.adjustments.length > 0 && (
        <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
          {student.adjustments.map((a) => (
            <li key={a.id}>
              Tuzatish {signedPoints(a.points)}: {a.reason}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
