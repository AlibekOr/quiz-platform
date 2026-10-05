import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  DownloadIcon,
} from "lucide-react";
import { MarkBadge } from "@/components/results/mark-badge";
import { ResultsGroupFilter } from "@/components/teacher/results/group-filter";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireTeacher } from "@/lib/auth/guards";
import { markFromPercent, type Mark } from "@/lib/grading";
import { db } from "@/lib/db";
import {
  defaultDir,
  hardestQuestions,
  sortRows,
  type AttemptSummary,
  type QuestionStat,
  type ResultSort,
  type SortDir,
} from "@/lib/results";
import { getTestResults } from "@/lib/results-data";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { resultsQuerySchema } from "@/lib/validators/results";

export const metadata: Metadata = { title: "Test natijalari" };

function one(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value) ?? null;
}

export default async function TestResultsPage({
  params,
  searchParams,
}: PageProps<"/teacher/tests/[id]/results">) {
  await requireTeacher();
  const { id } = await params;
  const raw = await searchParams;
  const query = resultsQuerySchema.parse({
    groupId: one(raw.groupId),
    sort: one(raw.sort),
    dir: one(raw.dir),
  });
  const sort = query.sort;
  const dir = query.dir ?? defaultDir(sort);

  const [results, groups] = await Promise.all([
    getTestResults(id, query.groupId),
    db.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!results) notFound();

  const rows = sortRows(results.rows, sort, dir);
  const firsts = rows.flatMap((r) => (r.first ? [r.first] : []));
  const avg =
    firsts.length > 0
      ? Math.round(firsts.reduce((s, f) => s + f.percent, 0) / firsts.length)
      : null;
  const top =
    firsts.length > 0 ? Math.max(...firsts.map((f) => f.percent)) : null;
  const markCounts: Record<Mark, number> = { 5: 0, 4: 0, fail: 0 };
  for (const f of firsts) markCounts[markFromPercent(f.percent)]++;
  const inProgress = rows.filter((r) => r.inProgressId).length;
  const hardest = hardestQuestions(results.questionStats);

  const base = `/teacher/tests/${id}/results`;
  const queryString = (next: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const merged = { groupId: query.groupId, sort, dir, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `?${p}`;
  };
  const exportHref = `/api/results/export${queryString({ testId: id })}`;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={`/teacher/tests/${id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Testga qaytish
        </Link>
        <div>
          <p className="text-muted-foreground text-sm">Natijalar</p>
          <h1 className="text-2xl font-semibold break-words">
            {results.test.title}
          </h1>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Ishladi"
          value={`${firsts.length}/${rows.length}`}
          hint="o'quvchi (birinchi urinish)"
        />
        <Stat label="O'rtacha" value={avg === null ? "—" : `${avg}%`} />
        <Stat label="Eng yuqori" value={top === null ? "—" : `${top}%`} />
        <Stat label="Hozir ishlamoqda" value={String(inProgress)} />
      </dl>

      {firsts.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-foreground">Baholar:</span>
          {([5, 4, "fail"] as const).map((m) => (
            <span key={m} className="flex items-center gap-1.5">
              <MarkBadge mark={m} />
              <span className="tabular-nums">{markCounts[m]} ta</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <ResultsGroupFilter groups={groups} value={query.groupId} />
        <a
          href={exportHref}
          className={buttonVariants({ variant: "outline" })}
          download
        >
          <DownloadIcon />
          CSV yuklab olish
        </a>
        <Link
          href={`/test/${id}/leaderboard`}
          className={buttonVariants({ variant: "outline" })}
        >
          Reyting
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          {query.groupId
            ? "Bu guruhda natijalar yo'q va test bu guruhga biriktirilmagan."
            : "Hali hech kim ishlamagan. Test guruhlarga biriktirilganini tekshiring."}
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">№</TableHead>
                {sortHead("O'quvchi", "name")}
                {sortHead("Birinchi urinish", "first", true)}
                <TableHead className="text-center">Baho</TableHead>
                {sortHead("Vaqt", "time", true, "hidden sm:table-cell")}
                {sortHead("Eng yaxshi", "best", true, "hidden sm:table-cell")}
                {sortHead("Urinish", "attempts", true)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.student.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/teacher/students/${r.student.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.student.fullName}
                    </Link>
                    <span className="text-muted-foreground block text-xs">
                      {r.student.groupName ?? "Guruhsiz"}
                      {!r.student.isActive && " · bloklangan"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.first ? (
                      <ScoreLink base={base} attempt={r.first} />
                    ) : r.inProgressId ? (
                      <Link href={`${base}/${r.inProgressId}`}>
                        <Badge>Ishlamoqda</Badge>
                      </Link>
                    ) : (
                      <Badge variant="outline">Ishlamagan</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {r.first ? (
                      <MarkBadge mark={markFromPercent(r.first.percent)} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {r.first ? formatDuration(r.first.durationSec) : "—"}
                  </TableCell>
                  <TableCell className="hidden text-right sm:table-cell">
                    {r.best && r.attemptCount > 1 ? (
                      <ScoreLink base={base} attempt={r.best} />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.attemptCount}
                    {r.inProgressId && r.first && (
                      <span className="text-muted-foreground block text-xs">
                        + davom etmoqda
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Savollar bo&apos;yicha statistika
          </h2>
          <p className="text-muted-foreground text-sm">
            Faqat birinchi urinishlar ({results.firstAttemptCount} ta)
            bo&apos;yicha. Javob berilmagan savol noto&apos;g&apos;ri
            hisoblanadi.
          </p>
        </div>
        {results.firstAttemptCount === 0 ? (
          <p className="text-muted-foreground">
            Hali yakunlangan urinishlar yo&apos;q.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">
                Eng qiyin {hardest.length} ta savol
              </h3>
              <ol className="flex flex-col gap-2">
                {hardest.map((q) => (
                  <li key={q.id} className="rounded-lg border p-3">
                    <QuestionSummary q={q} />
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Barcha savollar</h3>
              <ol className="flex flex-col gap-2">
                {results.questionStats.map((q) => (
                  <li key={q.id} className="rounded-lg border">
                    <details className="group">
                      <summary className="cursor-pointer list-none p-3">
                        <QuestionSummary q={q} />
                      </summary>
                      <ul className="flex flex-col gap-1 border-t p-3 text-sm">
                        {q.options.map((o, oi) => (
                          <li key={o.id} className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-6 shrink-0",
                                o.isCorrect
                                  ? "text-primary font-semibold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {String.fromCharCode(65 + oi)})
                            </span>
                            <span className="min-w-0 flex-1 break-words">
                              {o.text}
                              {o.isCorrect && (
                                <span className="text-primary">
                                  {" "}
                                  · to&apos;g&apos;ri
                                </span>
                              )}
                            </span>
                            <span className="text-muted-foreground shrink-0 tabular-nums">
                              {o.picks} ta · {o.percent}%
                            </span>
                          </li>
                        ))}
                        <li className="text-muted-foreground pt-1 text-xs">
                          Javob bermaganlar: {q.total - q.answered} ta
                        </li>
                      </ul>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </section>
    </>
  );

  function sortHead(
    label: string,
    value: ResultSort,
    right = false,
    className?: string,
  ) {
    const active = sort === value;
    const nextDir: SortDir = active
      ? dir === "asc"
        ? "desc"
        : "asc"
      : defaultDir(value);
    const Icon = dir === "asc" ? ArrowUpIcon : ArrowDownIcon;
    return (
      <TableHead
        key={value}
        className={cn(right && "text-right", className)}
        aria-sort={
          active ? (dir === "asc" ? "ascending" : "descending") : undefined
        }
      >
        <Link
          href={`${base}${queryString({ sort: value, dir: nextDir })}`}
          replace
          scroll={false}
          className={cn(
            "hover:text-foreground inline-flex items-center gap-1",
            active && "text-foreground",
          )}
        >
          {label}
          {active && <Icon className="size-3.5" />}
        </Link>
      </TableHead>
    );
  }
}

function ScoreLink({
  base,
  attempt,
}: {
  base: string;
  attempt: AttemptSummary;
}) {
  return (
    <Link
      href={`${base}/${attempt.id}`}
      className="tabular-nums hover:underline"
    >
      {attempt.score}/{attempt.maxScore}
      <span className="text-muted-foreground"> · {attempt.percent}%</span>
      {attempt.status === "EXPIRED" && (
        <span className="text-muted-foreground block text-xs">
          vaqt tugagan
        </span>
      )}
    </Link>
  );
}

function QuestionSummary({ q }: { q: QuestionStat }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2 text-sm">
        <span className="text-muted-foreground shrink-0">{q.number}.</span>
        <span className="line-clamp-2 min-w-0 flex-1 break-words">
          {q.text}
        </span>
        <span className="shrink-0 font-semibold tabular-nums">
          {q.percent}%
        </span>
      </div>
      <div
        className="bg-muted h-1.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`To'g'ri javoblar: ${q.percent}%`}
      >
        <div
          className={cn(
            "h-full rounded-full",
            q.percent < 40
              ? "bg-destructive"
              : q.percent < 70
                ? "bg-amber-500"
                : "bg-primary",
          )}
          style={{ width: `${q.percent}%` }}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        To&apos;g&apos;ri: {q.correct}/{q.total} · javob bermagan:{" "}
        {q.total - q.answered}
        {q.type === "MULTIPLE" && " · bir nechta javobli"}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="text-muted-foreground text-xs">{hint}</dd>}
    </div>
  );
}
