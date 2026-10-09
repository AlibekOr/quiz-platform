import type { Metadata } from "next";
import Link from "next/link";
import { DownloadIcon } from "lucide-react";
import { ParamSelect } from "@/components/common/param-select";
import { GradeSheetTable } from "@/components/teacher/grades/grade-sheet-table";
import { buttonVariants } from "@/components/ui/button";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getPeriodGrades } from "@/lib/grades-data";
import { formatDate, fromDbDate, todayInTashkent } from "@/lib/time";

export const metadata: Metadata = { title: "Baholar" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function GradesPage({
  searchParams,
}: PageProps<"/teacher/grades">) {
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
        select: { id: true, name: true, startDate: true, endDate: true },
      })
    : [];
  // Default: bugun ichiga tushadigan davr, bo'lmasa eng yangisi
  const today = todayInTashkent();
  const periodId =
    periods.find((p) => p.id === param(params.period))?.id ??
    periods.find(
      (p) => fromDbDate(p.startDate) <= today && today <= fromDbDate(p.endDate),
    )?.id ??
    periods[0]?.id;
  const data = periodId ? await getPeriodGrades(periodId) : null;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Baholar</h1>
        {data && (
          <a
            href={`/api/grades/export?periodId=${encodeURIComponent(data.period.id)}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <DownloadIcon />
            Excel&apos;ga eksport
          </a>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground">Guruhlar yo&apos;q.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ParamSelect
              name="group"
              value={groupId ?? ""}
              label="Guruh"
              reset={["period"]}
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
            />
            {periods.length > 0 && (
              <ParamSelect
                name="period"
                value={periodId ?? ""}
                label="Davr"
                options={periods.map((p) => ({ value: p.id, label: p.name }))}
              />
            )}
          </div>

          {!data ? (
            <p className="text-muted-foreground">
              Bu guruhda baholash davri yo&apos;q.{" "}
              <Link href={`/teacher/groups/${groupId}`} className="underline">
                Guruh sahifasida davr qo&apos;shing
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                {formatDate(data.period.startDate)} –{" "}
                {formatDate(data.period.endDate)} · o&apos;tish chegarasi{" "}
                {data.period.passPercent}% · {data.sheet.items.length} ta item
              </p>
              {data.sheet.items.length === 0 ? (
                <p className="text-muted-foreground">
                  Davrda hali vazifa yoki test yo&apos;q.{" "}
                  <Link
                    href={`/teacher/homework?group=${groupId}`}
                    className="underline"
                  >
                    Vazifa qo&apos;shing
                  </Link>{" "}
                  yoki test sozlamalarida testni davrga biriktiring.
                </p>
              ) : data.sheet.students.length === 0 ? (
                <p className="text-muted-foreground">
                  Bu davrda guruhda o&apos;quvchi bo&apos;lmagan.
                </p>
              ) : (
                <>
                  <GradeSheetTable sheet={data.sheet} />
                  <p className="text-muted-foreground text-xs">
                    — ozod qilingan · qizil 0 — muddati o&apos;tib baholanmagan
                    · bo&apos;sh — muddati hali o&apos;tmagan (hisobga kirmaydi)
                    · * izoh bor (ustiga olib boring). Jami maksimalga faqat
                    hisobga kirgan itemlar qo&apos;shiladi.
                  </p>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
