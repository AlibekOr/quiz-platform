// Soat siferblati (vaqt tanlash) uchun sof funksiyalar. 24 soatlik:
// tashqi halqa 1–12, ichki halqa 13–23 va 00. Burchak — tepadan soat strelkasi bo'yicha

/** Ichki halqa radiusining tashqi halqaga nisbati */
export const INNER_RATIO = 0.62;

export type ClockMode = "hour" | "minute";

/** Siferblatdagi raqam o'rni (markazdan, radius birligida: tashqi halqa = 1) */
export type DialMark = { value: number; label: string; x: number; y: number };

function at(index: number, of: number, r: number): { x: number; y: number } {
  const rad = (index / of) * 2 * Math.PI;
  return { x: r * Math.sin(rad), y: -r * Math.cos(rad) };
}

export function hourMarks(): DialMark[] {
  return Array.from({ length: 12 }, (_, k) => [
    {
      value: k === 0 ? 12 : k,
      label: String(k === 0 ? 12 : k),
      ...at(k, 12, 1),
    },
    {
      value: k === 0 ? 0 : k + 12,
      label: k === 0 ? "00" : String(k + 12),
      ...at(k, 12, INNER_RATIO),
    },
  ]).flat();
}

export function minuteMarks(): DialMark[] {
  return Array.from({ length: 12 }, (_, k) => ({
    value: k * 5,
    label: String(k * 5).padStart(2, "0"),
    ...at(k, 12, 1),
  }));
}

/** Tanlangan qiymatning siferblatdagi o'rni (strelka uchi) */
export function valuePosition(
  mode: ClockMode,
  value: number,
): { x: number; y: number } {
  if (mode === "minute") return at(value, 60, 1);
  const inner = value === 0 || value > 12;
  return at(value % 12, 12, inner ? INNER_RATIO : 1);
}

/**
 * Bosilgan nuqta -> qiymat. x, y — markazdan, radius birligida (tashqi halqa = 1).
 * Daqiqa `step` ga yaxlitlanadi
 */
export function pointToValue(
  mode: ClockMode,
  x: number,
  y: number,
  step = 5,
): number {
  const deg = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
  if (mode === "minute") return (Math.round(deg / 6 / step) * step) % 60;
  const k = Math.round(deg / 30) % 12;
  const inner = Math.hypot(x, y) < (1 + INNER_RATIO) / 2;
  if (inner) return k === 0 ? 0 : k + 12;
  return k === 0 ? 12 : k;
}

/** "14:05" -> { hour: 14, minute: 5 }; bo'sh yoki noto'g'ri bo'lsa null */
export function parseTime(
  value: string,
): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
