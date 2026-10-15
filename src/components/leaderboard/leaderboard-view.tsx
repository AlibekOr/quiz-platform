import Link from "next/link";
import { formatPoints } from "@/lib/grades";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import type { ResolvedLeaderboard } from "@/lib/leaderboard-access";
import type { SemesterLeaderboardEntry } from "@/lib/semester-leaderboard";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { LeaderboardGroupSelect } from "./group-select";

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Reyting: "Mening guruhim" / "Umumiy" tablari, xodimga guruh tanlagich.
 * Test reytingi — ball va vaqt; bosh reyting — joriy semestr jami bali
 */
export function LeaderboardView({
  data,
  basePath,
  isTeacher,
  groups,
}: {
  data: ResolvedLeaderboard;
  basePath: string;
  isTeacher: boolean;
  /** O'qituvchi uchun guruh tanlagich */
  groups: { id: string; name: string }[];
}) {
  const { scope } = data;
  const showGroup = scope === "all";

  const tabs = [
    { scope: "group", label: isTeacher ? "Guruh" : "Mening guruhim" },
    { scope: "all", label: "Umumiy" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <nav
          aria-label="Reyting turi"
          className="inline-flex rounded-lg border p-1"
        >
          {tabs.map((t) => (
            <Link
              prefetch={false}
              key={t.scope}
              href={`${basePath}?scope=${t.scope}${t.scope === "group" && isTeacher && data.group ? `&groupId=${data.group.id}` : ""}`}
              aria-current={scope === t.scope ? "page" : undefined}
              className={cn(
                "text-muted-foreground rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                scope === t.scope && "bg-primary text-primary-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        {isTeacher && scope === "group" && data.group && groups.length > 0 && (
          <LeaderboardGroupSelect groups={groups} value={data.group.id} />
        )}
        {!isTeacher && scope === "group" && data.group && (
          <span className="text-muted-foreground text-sm">
            {data.group.name}
          </span>
        )}
      </div>

      {scope === "group" && !data.group ? (
        <p className="text-muted-foreground">
          {isTeacher
            ? "Guruhlar yo'q."
            : "Siz hali guruhga biriktirilmagansiz."}
        </p>
      ) : data.board.entries.length === 0 ? (
        <p className="text-muted-foreground">
          {data.kind === "semester"
            ? "Bu guruhda joriy semestr yo'q yoki hali ball qo'yilmagan."
            : "Hali natijalar yo'q."}
        </p>
      ) : data.kind !== "semester" ? (
        <BoardTable
          showGroup={showGroup}
          entries={data.board.entries}
          me={data.board.me}
          valueHeaders={
            data.kind === "tests"
              ? ["Ball", "Testlar", "Vaqt"]
              : ["Ball", "Vaqt"]
          }
          values={(e: LeaderboardEntry) =>
            data.kind === "tests"
              ? [
                  String(e.score),
                  String(e.tests),
                  formatDuration(e.durationSec),
                ]
              : [String(e.score), formatDuration(e.durationSec)]
          }
        />
      ) : (
        <BoardTable
          showGroup={showGroup}
          entries={data.board.entries}
          me={data.board.me}
          valueHeaders={["To'plagan", "Jarima", "Jami"]}
          values={(e: SemesterLeaderboardEntry) => [
            formatPoints(e.earned),
            e.penalties > 0 ? `−${formatPoints(e.penalties)}` : "0",
            formatPoints(e.total).replace("-", "−"),
          ]}
          danger={(e: SemesterLeaderboardEntry) => e.belowNorm}
          strongLast
        />
      )}
      <p className="text-muted-foreground text-xs">
        {data.kind === "test"
          ? "Faqat birinchi urinish hisobga olinadi. Teng ball bo'lsa, kamroq vaqt sarflagan yuqorida."
          : data.kind === "tests"
            ? "Barcha testlardagi birinchi urinish ballari yig'indisi. Teng bo'lsa, umumiy vaqt kamrog'i yuqorida."
            : "To'plagan — uyga vazifa, amaliy, og'zaki va bonus ballari; Jarima — qo'yilgan jarimalar (uyga vazifa bajarilmagan, darsga sababsiz kelmagan va boshqalar); Jami — to'plagandan jarima ayirilgani. Har guruh o'zining joriy semestri bo'yicha."}
        {data.kind === "semester" &&
          [...data.board.entries, data.board.me].some((e) => e?.belowNorm) &&
          " Semestrning oxirgi 2 haftasida o'tish balidan past bo'lganlar qizil va ro'yxat oxirida."}
        {data.board.total > 0 && ` Jami: ${data.board.total} ta o'quvchi.`}
      </p>
    </div>
  );
}

type BaseEntry = {
  userId: string;
  fullName: string;
  groupName: string | null;
  rank: number;
};

function BoardTable<E extends BaseEntry>({
  entries,
  me,
  showGroup,
  valueHeaders,
  values,
  danger,
  strongLast = false,
}: {
  entries: E[];
  me: E | null;
  showGroup: boolean;
  valueHeaders: string[];
  values: (entry: E) => string[];
  /** Qizil qator (normativdan past) */
  danger?: (entry: E) => boolean;
  /** Oxirgi ustun (Jami) qalin */
  strongLast?: boolean;
}) {
  const meOutside = me && !entries.some((e) => e.userId === me.userId);
  const columns = 2 + (showGroup ? 1 : 0) + valueHeaders.length;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b text-left">
            <th className="w-16 px-3 py-2 font-medium">O&apos;rin</th>
            <th className="px-3 py-2 font-medium">Ism</th>
            {showGroup && (
              <th className="hidden px-3 py-2 font-medium sm:table-cell">
                Guruh
              </th>
            )}
            {valueHeaders.map((h) => (
              <th key={h} className="px-2 py-2 text-right font-medium sm:px-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <Row
              key={e.userId}
              entry={e}
              me={e.userId === me?.userId}
              showGroup={showGroup}
              values={values(e)}
              danger={danger?.(e) ?? false}
              strongLast={strongLast}
            />
          ))}
        </tbody>
        {meOutside && (
          <tfoot>
            <tr>
              <td
                colSpan={columns}
                className="text-muted-foreground border-t px-3 py-1 text-center"
              >
                ⋯
              </td>
            </tr>
            <Row
              entry={me}
              me
              showGroup={showGroup}
              values={values(me)}
              danger={danger?.(me) ?? false}
              strongLast={strongLast}
              prefix="Siz: "
            />
          </tfoot>
        )}
      </table>
    </div>
  );
}

function Row({
  entry,
  me,
  showGroup,
  values,
  danger,
  strongLast,
  prefix,
}: {
  entry: BaseEntry;
  me: boolean;
  showGroup: boolean;
  values: string[];
  danger: boolean;
  strongLast: boolean;
  prefix?: string;
}) {
  return (
    <tr
      aria-current={me ? "true" : undefined}
      className={cn(
        "border-b last:border-0",
        me && "bg-primary/10 font-semibold",
        danger && "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
        danger && me && "bg-red-100 dark:bg-red-950/70",
      )}
    >
      <td className="px-3 py-2 whitespace-nowrap tabular-nums">
        {prefix}
        {entry.rank <= 3 && !danger ? (
          <span>
            <span aria-hidden>{MEDALS[entry.rank - 1]}</span> {entry.rank}
          </span>
        ) : (
          `${entry.rank}${prefix ? "-o'rin" : ""}`
        )}
      </td>
      <td className="px-3 py-2">
        {entry.fullName}
        {showGroup && entry.groupName && (
          <span className="text-muted-foreground block text-xs font-normal sm:hidden">
            {entry.groupName}
          </span>
        )}
      </td>
      {showGroup && (
        <td className="text-muted-foreground hidden px-3 py-2 sm:table-cell">
          {entry.groupName ?? "—"}
        </td>
      )}
      {values.map((v, i) => (
        <td
          key={i}
          className={cn(
            "px-2 py-2 text-right tabular-nums sm:px-3",
            strongLast && i === values.length - 1 && "font-semibold",
          )}
        >
          {v}
        </td>
      ))}
    </tr>
  );
}
