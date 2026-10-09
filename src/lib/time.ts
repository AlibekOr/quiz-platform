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
  const p = Object.fromEntries(
    dateTimeFormatter.formatToParts(date).map((x) => [x.type, x.value]),
  );
  return `${p.day}.${p.month}.${p.year}, ${p.hour}:${p.minute}`;
}

// ---------- Kalendar sanalari ("YYYY-MM-DD", Toshkent bo'yicha) ----------
// Sana satr ko'rinishida yuradi; bazada @db.Date sifatida UTC yarim tun bilan saqlanadi.

export type DateStr = string;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

/** Toshkentdagi bugungi sana. Server UTC'da ishlasa ham to'g'ri */
export function todayInTashkent(now: Date = new Date()): DateStr {
  return ymdFormatter.format(now);
}

export function isValidDateStr(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const d = toDbDate(value);
  return (
    d.getUTCFullYear() === Number(m[1]) &&
    d.getUTCMonth() + 1 === Number(m[2]) &&
    d.getUTCDate() === Number(m[3])
  );
}

export function isValidMonthStr(value: string): boolean {
  const m = MONTH_RE.exec(value);
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

/** "2026-10-04" -> Date (UTC yarim tun) — Prisma @db.Date uchun */
export function toDbDate(date: DateStr): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** Toshkentda shu kun boshlanadigan lahza (Toshkentda yozgi vaqt yo'q: doim +05:00) */
export function startOfDayInTashkent(date: DateStr): Date {
  return new Date(`${date}T00:00:00.000+05:00`);
}

/** @db.Date qiymati -> "2026-10-04" */
export function fromDbDate(date: Date): DateStr {
  return date.toISOString().slice(0, 10);
}

/** 1 = Dushanba ... 7 = Yakshanba */
export function weekdayOf(date: DateStr): number {
  const day = toDbDate(date).getUTCDay();
  return day === 0 ? 7 : day;
}

export function addDays(date: DateStr, days: number): DateStr {
  const d = toDbDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromDbDate(d);
}

/** from..to (ikkalasi ham kiradi) */
export function datesBetween(from: DateStr, to: DateStr): DateStr[] {
  const result: DateStr[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) result.push(d);
  return result;
}

/** "2026-10" -> { from: "2026-10-01", to: "2026-10-31" } */
export function monthRange(month: string): { from: DateStr; to: DateStr } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(last).padStart(2, "0")}`,
  };
}

/** "2026-10-04" -> "04.10" (jadval ustunlari uchun) */
export function formatDayMonth(date: DateStr): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}`;
}

/** "2026-10-04" -> "04.10.2026" */
export function formatDate(date: DateStr): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.${date.slice(0, 4)}`;
}

export const WEEKDAYS = [
  { value: 1, short: "Du", long: "Dushanba" },
  { value: 2, short: "Se", long: "Seshanba" },
  { value: 3, short: "Cho", long: "Chorshanba" },
  { value: 4, short: "Pa", long: "Payshanba" },
  { value: 5, short: "Ju", long: "Juma" },
  { value: 6, short: "Sha", long: "Shanba" },
  { value: 7, short: "Ya", long: "Yakshanba" },
] as const;

export function weekdayShort(weekday: number): string {
  return WEEKDAYS[weekday - 1]?.short ?? "?";
}

export function weekdayLong(weekday: number): string {
  return WEEKDAYS[weekday - 1]?.long ?? "?";
}

/** Jadvalni qisqa ko'rinishda: "Du, Cho, Ju · 14:00–16:00"; vaqtlar har xil bo'lsa kunma-kun */
export function formatSchedule(
  rows: readonly { weekday: number; startTime: string; endTime: string }[],
): string {
  if (rows.length === 0) return "";
  const sorted = [...rows].sort((a, b) => a.weekday - b.weekday);
  const times = new Set(sorted.map((r) => `${r.startTime}–${r.endTime}`));
  if (times.size === 1) {
    return `${sorted.map((r) => weekdayShort(r.weekday)).join(", ")} · ${[...times][0]}`;
  }
  return sorted
    .map((r) => `${weekdayShort(r.weekday)} ${r.startTime}–${r.endTime}`)
    .join(", ");
}
