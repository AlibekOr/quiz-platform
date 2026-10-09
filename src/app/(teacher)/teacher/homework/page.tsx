import type { Metadata } from "next";
import Link from "next/link";
import { ParamSelect } from "@/components/common/param-select";
import {
  AddHomeworkButton,
  HomeworkRowActions,
} from "@/components/teacher/homework/homework-controls";
import { Badge } from "@/components/ui/badge";
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
    ? await db.period.findMany({
        where: { groupId },
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          homeworks: {
            orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
            select: {
              id: true,
              periodId: true,
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
  // Yangi vazifa uchun default: bugun ichiga tushadigan davr, bo'lmasa eng yangisi
  const current = periods.find(
    (p) => fromDbDate(p.startDate) <= today && today <= fromDbDate(p.endDate),
  );

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
          <Link href="/teacher/groups" className="underline">
            guruh yarating
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="sm:max-w-xs">
            <ParamSelect
              name="group"
              value={groupId ?? ""}
              label="Guruh"
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
            />
          </div>

          {periods.length === 0 ? (
            <p className="text-muted-foreground">
              Bu guruhda baholash davri yo&apos;q.{" "}
              <Link href={`/teacher/groups/${groupId}`} className="underline">
                Guruh sahifasida davr qo&apos;shing
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
                {p.homeworks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Vazifa yo&apos;q.
                  </p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vazifa</TableHead>
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
                        {p.homeworks.map((h) => {
                          const due = fromDbDate(h.dueDate);
                          return (
                            <TableRow key={h.id}>
                              <TableCell className="font-medium">
                                <Link
                                  href={`/teacher/homework/${h.id}`}
                                  className="hover:underline"
                                >
                                  {h.title}
                                </Link>
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
                                    periodId: h.periodId,
                                    title: h.title,
                                    description: h.description,
                                    dueDate: due,
                                    maxPoints: h.maxPoints,
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
