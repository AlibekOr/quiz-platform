import type { Metadata } from "next";
import Link from "next/link";
import { RiskBlock } from "@/components/risk/risk-block";
import { Badge } from "@/components/ui/badge";
import { requireManager } from "@/lib/auth/guards";
import { getScope, groupScopeWhere } from "@/lib/auth/scope";
import { getScheduleRows, schedulesOf } from "@/lib/cached-data";
import { db } from "@/lib/db";
import { groupLabel } from "@/lib/group-label";
import { getRiskRows } from "@/lib/risk-data";
import {
  formatDate,
  formatSchedule,
  todayInTashkent,
  weekdayLong,
  weekdayOf,
} from "@/lib/time";

export const metadata: Metadata = { title: "Menejer paneli" };

const RISK_LIMIT = 20;

// Qisqa ko'rinish: qaysi o'qituvchilar bilan ishlaydi, ular biriktirgan guruhlar,
// bugungi darslar, kutilayotgan so'rovlar
export default async function ManagerHomePage() {
  const manager = await requireManager();
  const scope = await getScope(manager);
  const today = todayInTashkent();
  const weekday = weekdayOf(today);

  const [groupRows, pending, scheduleRows, teachers, riskRows] =
    await Promise.all([
      db.group.findMany({
        where: groupScopeWhere(scope),
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          region: { select: { name: true } },
          teacher: { select: { fullName: true } },
          _count: {
            select: { students: { where: { archivedAt: null } } },
          },
        },
      }),
      db.deletionRequest.count({
        where: { requestedById: manager.id, status: "PENDING" },
      }),
      getScheduleRows(),
      db.teacherManager.findMany({
        where: { managerId: manager.id },
        orderBy: { teacher: { fullName: "asc" } },
        select: { teacher: { select: { id: true, fullName: true } } },
      }),
      // Baholar menejerga yopiq: faqat davomat va vazifa signallari
      getRiskRows(scope, { forManager: true }),
    ]);
  // Dars jadvali keshdan (lib/cached-data.ts)
  const groups = groupRows.map((g) => ({
    ...g,
    schedules: schedulesOf(scheduleRows, g.id),
  }));
  const todays = groups
    .flatMap((g) =>
      g.schedules
        .filter((s) => s.weekday === weekday)
        .map((s) => ({ id: g.id, name: groupLabel(g), ...s })),
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Salom, {manager.fullName}</h1>
        <p className="text-muted-foreground text-sm">
          Bugun {weekdayLong(weekday).toLowerCase()}, {formatDate(today)}
        </p>
      </div>

      {teachers.length > 0 && (
        <p className="text-sm">
          <span className="text-muted-foreground">
            O&apos;qituvchilaringiz:{" "}
          </span>
          {teachers.map((t) => t.teacher.fullName).join(", ")}
        </p>
      )}

      {groups.length === 0 ? (
        <p className="text-muted-foreground">
          Sizga hali guruh biriktirilmagan. O&apos;qituvchiga murojaat qiling.
        </p>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Bugungi darslar</h2>
            {todays.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bugun dars yo&apos;q.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border text-sm">
                {todays.map((l) => (
                  <li
                    key={`${l.id}-${l.startTime}`}
                    className="flex justify-between gap-2 p-3"
                  >
                    <Link
                      prefetch={false}
                      href={`/manager/attendance?group=${l.id}`}
                      className="font-medium hover:underline"
                    >
                      {l.name}
                    </Link>
                    <span className="tabular-nums">
                      {l.startTime}–{l.endTime}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <RiskBlock
            rows={riskRows}
            limit={RISK_LIMIT}
            description="Joriy semestr: davomat va topshirilmagan vazifalar"
            fullHref={null}
            studentHref={null}
          />

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              Guruhlarim ({groups.length})
            </h2>
            <ul className="divide-y rounded-lg border text-sm">
              {groups.map((g) => (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3"
                >
                  <div className="flex flex-col">
                    <Link
                      prefetch={false}
                      href={`/manager/students?group=${g.id}`}
                      className="font-medium hover:underline"
                    >
                      {groupLabel(g)}
                    </Link>
                    <span className="text-muted-foreground text-xs">
                      {g.teacher.fullName} ·{" "}
                      {formatSchedule(g.schedules) || "jadval yo'q"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {g.region && (
                      <Badge variant="outline">{g.region.name}</Badge>
                    )}
                    <span className="tabular-nums">
                      {g._count.students} o&apos;quvchi
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {pending > 0 && (
        <p className="text-sm">
          <Link prefetch={false} href="/manager/requests" className="underline">
            Kutilayotgan o&apos;chirish so&apos;rovlari: {pending}
          </Link>
        </p>
      )}
    </>
  );
}
