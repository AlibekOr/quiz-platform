// Barcha sana/vaqt hisoblari shu yerda. Vaqt zonasi har doim Asia/Tashkent (CLAUDE.md, 9-qoida)

export const TIME_ZONE = "Asia/Tashkent";

/** 125 -> "2:05", 3725 -> "1:02:05" */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = String(sec % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

/** Toshkent vaqti bo'yicha "04.10.2026, 14:05" (uz-UZ locale "/" ajratgich beradi) */
export function formatDateTime(date: Date): string {
  const p = Object.fromEntries(dateTimeFormatter.formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.day}.${p.month}.${p.year}, ${p.hour}:${p.minute}`;
}
