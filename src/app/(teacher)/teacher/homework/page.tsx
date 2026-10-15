import type { Metadata } from "next";
import Link from "next/link";
import { ParamSelect } from "@/components/common/param-select";
import {
  AddHomeworkButton,
  HomeworkRowActions,
} from "@/components/teacher/homework/homework-controls";
import { HomeworkMatrix } from "@/components/teacher/homework/homework-matrix";
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
import { db } from "@/lib/db";
import { CATEGORY_LABEL } from "@/lib/grades";
import { getSemesterGrades } from "@/lib/grades-data";
import { formatDate, fromDbDate, todayInTashkent } from "@/lib/time";

export const metadata: Metadata = { title: "Uyga vazifalar" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function HomeworkPage({
  searchParams,
}: PageProps<"/teacher/homework">) {
  await requireTeacher();
  const params = await searchParams;

  const groups = await db.group.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const groupId =
    groups.find((g) => g.id === param(params.group))?.id ?? groups[0]?.id;

  const periods = groupId
    ? await db.semester.findMany({
        where: { groupId },
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          assignments: {
            orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
            select: {
              id: true,
              semesterId: true,
              category: true,
              lesson: { select: { id: true, date: true } },
              title: true,
              description: true,
              dueDate: true,
              maxPoints: true,
              _count: { select: { grades: true } },
            },
          },
        },
      })
    : [];
  const periodOptions = periods.map((p) => ({ id: p.id, name: p.name }));
  const today = todayInTashkent();
  // Yangi topshiriq uchun default: bugun ichiga tushadigan semestr, bo'lmasa eng yangisi
  const current = periods.find(
    (p) => fromDbDate(p.startDate) <= today && today <= fromDbDate(p.endDate),
  );
  // Jadval ko'rinishi: o'quvchilar × joriy (bo'lmasa eng yangi) semestr topshiriqlari
  const view = param(params.view) === "table" ? "table" : "list";
  const matrixSemester = current ?? periods[0];
  const matrix =
    view === "table" && matrixSemester
      ? await getSemesterGrades(matrixSemester.id)
      : null;
  const viewHref = (v: "list" | "table") =>
    `/teacher/homework?group=${groupId ?? ""}${v === "table" ? "&view=table" : ""}`;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Uyga vazifalar</h1>
        {groupId && (
          <AddHomeworkButton
            periods={periodOptions}
            defaultPeriodId={current?.id}
          />
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground">
          Avval{" "}
          <Link prefetch={false} href="/teacher/groups" className="underline">
            guruh yarating
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="sm:w-64">
              <ParamSelect
                name="group"
                value={groupId ?? ""}
                label="Guruh"
                options={groups.map((g) => ({ value: g.id, label: g.name }))}
              />
            </div>
            <div className="flex gap-1" role="tablist" aria-label="Ko'rinish">
              {(["list", "table"] as const).map((v) => (
                <Link
                  prefetch={false}
                  key={v}
                  href={viewHref(v)}
                  role="tab"
                  aria-selected={view === v}
                  className={buttonVariants({
                    size: "sm",
                    variant: view === v ? "secondary" : "ghost",
                  })}
                >
                  {v === "list" ? "Ro'yxat" : "Jadval"}
                </Link>
              ))}
            </div>
          </div>

          {matrix && (
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold">{matrix.semester.name}</h2>
              <HomeworkMatrix data={matrix} today={today} />
            </section>
          )}

          {view === "table" && periods.length > 0 ? null : periods.length ===
            0 ? (
            <p className="text-muted-foreground">
              Bu guruhda semestr yo&apos;q.{" "}
              <Link
                prefetch={false}
                href={`/teacher/groups/${groupId}`}
                className="underline"
              >
                Guruh sahifasida semestr qo&apos;shing
              </Link>
              .
            </p>
          ) : (
            periods.map((p) => (
              <section key={p.id} className="flex flex-col gap-2">
                <h2 className="font-semibold">
                  {p.name}{" "}
                  <span className="text-muted-foreground text-sm font-normal">
                    {formatDate(fromDbDate(p.startDate))} –{" "}
                    {formatDate(fromDbDate(p.endDate))}
                  </span>
                </h2>
                {p.assignments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Topshiriq yo&apos;q.
                  </p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-muted-foreground w-10">
                            №
                          </TableHead>
                          <TableHead>Topshiriq</TableHead>
                          <TableHead>Turi</TableHead>
                          <TableHead>Muddat</TableHead>
                          <TableHead className="text-right">Maks.</TableHead>
                          <TableHead className="text-right">
                            Baholangan
                          </TableHead>
                          <TableHead className="w-12">
                            <span className="sr-only">Amallar</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {p.assignments.map((h, i) => {
                          const due = fromDbDate(h.dueDate);
                          return (
                            <TableRow key={h.id}>
                              <TableCell className="text-muted-foreground tabular-nums">
                                {i + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                <Link
                                  prefetch={false}
                                  href={`/teacher/homework/${h.id}`}
                                  className="hover:underline"
                                >
                                  {h.title}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {CATEGORY_LABEL[h.category]}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {formatDate(due)}{" "}
                                {due < today ? (
                                  <Badge variant="outline">tugagan</Badge>
                                ) : due === today ? (
                                  <Badge>bugun</Badge>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {h.maxPoints}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {h._count.grades}
                              </TableCell>
                              <TableCell>
                                <HomeworkRowActions
                                  periods={periodOptions}
                                  homework={{
                                    id: h.id,
                                    semesterId: h.semesterId,
                                    category: h.category,
                                    title: h.title,
                                    description: h.description,
                                    dueDate: due,
                                    maxPoints: h.maxPoints,
                                    gradedCount: h._count.grades,
                                    lessonId: h.lesson?.id ?? null,
                                    lessonDate: h.lesson
                                      ? fromDbDate(h.lesson.date)
                                      : null,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>
            ))
          )}
        </>
      )}
    </>
  );
}
