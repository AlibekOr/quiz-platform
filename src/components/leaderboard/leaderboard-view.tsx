import Link from "next/link";
import type { ResolvedLeaderboard } from "@/lib/leaderboard-access";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { LeaderboardGroupSelect } from "./group-select";

const MEDALS = ["🥇", "🥈", "🥉"];

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
  const { board, scope } = data;
  const meId = board.me?.userId;
  const meOutside = board.me && !board.entries.some((e) => e.userId === meId);
  const showGroup = scope === "all";
  const overall = data.test === null;

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
      ) : board.entries.length === 0 ? (
        <p className="text-muted-foreground">Hali natijalar yo&apos;q.</p>
      ) : (
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
                <th className="px-3 py-2 text-right font-medium">Ball</th>
                <th className="px-3 py-2 text-right font-medium">Vaqt</th>
              </tr>
            </thead>
            <tbody>
              {board.entries.map((e) => (
                <Row
                  key={e.userId}
                  entry={e}
                  me={e.userId === meId}
                  showGroup={showGroup}
                  overall={overall}
                />
              ))}
            </tbody>
            {meOutside && board.me && (
              <tfoot>
                <tr>
                  <td
                    colSpan={showGroup ? 5 : 4}
                    className="text-muted-foreground border-t px-3 py-1 text-center"
                  >
                    ⋯
                  </td>
                </tr>
                <Row
                  entry={board.me}
                  me
                  showGroup={showGroup}
                  overall={overall}
                  prefix="Siz: "
                />
              </tfoot>
            )}
          </table>
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        Faqat birinchi urinish hisobga olinadi. Teng ball bo&apos;lsa, kamroq
        vaqt sarflagan yuqorida
        {overall && " (umumiy reytingda — barcha testlar bo'yicha yig'indi)"}.
        {board.total > 0 && ` Jami: ${board.total} ta o'quvchi.`}
      </p>
    </div>
  );
}

function Row({
  entry,
  me,
  showGroup,
  overall,
  prefix,
}: {
  entry: LeaderboardEntry;
  me: boolean;
  showGroup: boolean;
  overall: boolean;
  prefix?: string;
}) {
  return (
    <tr
      aria-current={me ? "true" : undefined}
      className={cn(
        "border-b last:border-0",
        me && "bg-primary/10 font-semibold",
      )}
    >
      <td className="px-3 py-2 whitespace-nowrap tabular-nums">
        {prefix}
        {entry.rank <= 3 ? (
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
      <td className="px-3 py-2 text-right tabular-nums">
        {entry.score}
        {overall && (
          <span className="text-muted-foreground block text-xs font-normal">
            {entry.tests} ta test
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        {formatDuration(entry.durationSec)}
      </td>
    </tr>
  );
}
