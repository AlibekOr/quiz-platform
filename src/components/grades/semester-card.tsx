import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
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
 * Bitta o'quvchining bitta semestri. summary — bosh sahifa uchun: jami, holat va
 * kategoriyalar jadvali. To'liq ko'rinish ("Baholarim", kartochka) — har bir ball va
 * jarima nima uchun qo'yilgani: topshiriqlar, og'zaki baholar, jarimalar, tuzatishlar
 */
export function SemesterCard({
  data,
  student,
  summary = false,
}: {
  data: SemesterGrades;
  student: StudentSemester;
  summary?: boolean;
}) {
  const { semester, assignments } = data;
  const r = student.result;
  const graded = assignments.filter((a) => student.grades[a.id]);
  const pending = assignments.filter((a) => !student.grades[a.id]);

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
        {r.adjustments !== 0 && (
          <div className="bg-muted/50 rounded-md px-3 py-2">
            <dt className="text-muted-foreground text-xs">Tuzatish</dt>
            <dd className="font-medium tabular-nums">
              {signedPoints(r.adjustments)}
            </dd>
          </div>
        )}
        {r.penalties > 0 && (
          <div className="bg-destructive/10 rounded-md px-3 py-2">
            <dt className="text-muted-foreground text-xs">Jarimalar</dt>
            <dd className="text-destructive font-medium tabular-nums">
              −{formatPoints(r.penalties)}
            </dd>
          </div>
        )}
      </dl>

      {summary ? (
        <Link
          prefetch={false}
          href="/grades"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 self-start text-sm"
        >
          Batafsil: nima uchun ball va jarima olingan
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : (
        <>
          {graded.length > 0 && (
            <Details title="Topshiriqlar">
              {graded.map((a) => {
                const g = student.grades[a.id];
                return (
                  <Item
                    key={a.id}
                    title={a.title}
                    meta={`${CATEGORY_LABEL[a.category]} · muddat ${formatDate(a.dueDate)}${g.note ? ` · ${g.note}` : ""}`}
                    value={`${formatPoints(g.points)} / ${a.maxPoints}`}
                  />
                );
              })}
            </Details>
          )}

          {pending.length > 0 && (
            <Details title="Hali baholanmagan">
              {pending.map((a) => (
                <Item
                  key={a.id}
                  title={a.title}
                  meta={`${CATEGORY_LABEL[a.category]} · muddat ${formatDate(a.dueDate)}`}
                  value="—"
                  muted
                />
              ))}
            </Details>
          )}

          {student.oral.length > 0 && (
            <Details title="Og'zaki baholar">
              {student.oral.map((o) => (
                <Item
                  key={o.date}
                  title={`${formatDate(o.date)} darsi`}
                  meta={o.note}
                  value={formatPoints(o.points)}
                />
              ))}
            </Details>
          )}

          {student.penalties.length > 0 && (
            <Details title="Jarimalar">
              {student.penalties.map((p) => (
                <Item
                  key={p.id}
                  title={p.name}
                  meta={`${formatDate(p.date)}${p.note ? ` · ${p.note}` : ""}${p.auto ? " · avtomatik" : ""}`}
                  value={`−${formatPoints(p.points)}`}
                  danger
                />
              ))}
            </Details>
          )}

          {student.adjustments.length > 0 && (
            <Details title="Tuzatishlar">
              {student.adjustments.map((a) => (
                <Item
                  key={a.id}
                  title={a.reason}
                  value={signedPoints(a.points)}
                />
              ))}
            </Details>
          )}
        </>
      )}
    </section>
  );
}

function Details({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="flex flex-col divide-y rounded-md border text-sm">
        {children}
      </ul>
    </div>
  );
}

function Item({
  title,
  meta,
  value,
  muted = false,
  danger = false,
}: {
  title: string;
  meta?: string | null;
  value: string;
  muted?: boolean;
  danger?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2">
      <div className="flex min-w-0 flex-col">
        <span className="font-medium break-words">{title}</span>
        {meta && <span className="text-muted-foreground text-xs">{meta}</span>}
      </div>
      <span
        className={
          danger
            ? "text-destructive shrink-0 font-medium tabular-nums"
            : muted
              ? "text-muted-foreground shrink-0 tabular-nums"
              : "shrink-0 font-medium tabular-nums"
        }
      >
        {value}
      </span>
    </li>
  );
}
