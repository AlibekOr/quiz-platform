import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { groupScopeWhere } from "@/lib/auth/scope";
import { requireTeacherScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { passScore } from "@/lib/grades";
import { groupLabel } from "@/lib/group-label";
import { formatDate, fromDbDate, todayInTashkent } from "@/lib/time";

export const metadata: Metadata = { title: "Semestrlar" };

// Sozlamalar → Semestrlar: barcha o'z guruhlari semestrlari. Qo'shish va tahrirlash —
// guruh sahifasida (semestr guruhga tegishli)
export default async function SemestersPage() {
  const { scope } = await requireTeacherScope();
  const today = todayInTashkent();
  const semesters = await db.semester.findMany({
    where: { group: groupScopeWhere(scope) },
    orderBy: [{ startDate: "desc" }, { group: { name: "asc" } }],
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      closed: true,
      maxTotal: true,
      passPercent: true,
      template: { select: { name: true } },
      group: { select: { id: true, name: true, code: true } },
      _count: { select: { assignments: true } },
    },
  });

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Semestrlar</h1>
        <p className="text-muted-foreground text-sm">
          Semestr qo&apos;shish va tahrirlash — guruh sahifasida.
        </p>
      </div>
      {semesters.length === 0 ? (
        <p className="text-muted-foreground">Hali semestr yo&apos;q.</p>
      ) : (
        <ul className="divide-y rounded-lg border text-sm">
          {semesters.map((s) => {
            const start = fromDbDate(s.startDate);
            const end = fromDbDate(s.endDate);
            const current = !s.closed && start <= today && today <= end;
            return (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2 font-medium">
                    {s.name}
                    {current && <Badge>Joriy</Badge>}
                    {s.closed && <Badge variant="secondary">Yopilgan</Badge>}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(start)} – {formatDate(end)} · jami {s.maxTotal},
                    o&apos;tish {passScore(s)} · {s._count.assignments} ta
                    topshiriq
                    {s.template && ` · shablon: ${s.template.name}`}
                  </span>
                </div>
                <Link
                  prefetch={false}
                  href={`/teacher/groups/${s.group.id}`}
                  className="hover:underline"
                >
                  {groupLabel(s.group)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
