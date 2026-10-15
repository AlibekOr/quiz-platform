import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { db } from "@/lib/db";

// Kam o'zgaradigan ma'lumotlar keshi (Vercel Data Cache): regionlar, faol jarima shablonlari,
// guruh dars jadvallari. Har bir sahifa ochilganda bazaga qayta so'rov ketmaydi.
// O'zgartiradigan server action'lar invalidateCache() chaqiradi; xavfsizlik uchun kesh
// baribir har soatda yangilanadi. Natija JSON'ga aylanadi — Date maydonlari tanlanmaydi.

export const CACHE_TAGS = {
  regions: "regions",
  penaltyTypes: "penalty-types",
  schedules: "group-schedules",
} as const;

type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

const HOUR = 3600;

/** O'zgarishdan keyin: keyingi so'rov eski qiymatni ko'rmaydi */
export function invalidateCache(...tags: CacheTag[]): void {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}

/** Tanlash ro'yxatlari uchun regionlar */
export const getRegionOptions = unstable_cache(
  async (): Promise<{ id: string; name: string }[]> =>
    db.region.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ["region-options"],
  { tags: [CACHE_TAGS.regions], revalidate: HOUR },
);

export type PenaltyOption = {
  id: string;
  name: string;
  defaultPoints: number;
};

/** Jarima qo'yish ro'yxati uchun faqat faol shablonlar */
export const getActivePenaltyTypes = unstable_cache(
  async (): Promise<PenaltyOption[]> =>
    db.penaltyType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, defaultPoints: true },
    }),
  ["active-penalty-types"],
  { tags: [CACHE_TAGS.penaltyTypes], revalidate: HOUR },
);

export type ScheduleRow = {
  groupId: string;
  weekday: number;
  startTime: string;
  endTime: string;
};

/** Barcha guruhlarning haftalik jadvali (kichik jadval: guruh × kun) */
export const getScheduleRows = unstable_cache(
  async (): Promise<ScheduleRow[]> =>
    db.groupSchedule.findMany({
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
      select: { groupId: true, weekday: true, startTime: true, endTime: true },
    }),
  ["group-schedules"],
  { tags: [CACHE_TAGS.schedules], revalidate: HOUR },
);

/** Guruh jadvali (weekday berilsa — faqat o'sha kun) */
export function schedulesOf(
  rows: readonly ScheduleRow[],
  groupId: string,
  weekday?: number,
): { weekday: number; startTime: string; endTime: string }[] {
  return rows
    .filter(
      (r) =>
        r.groupId === groupId &&
        (weekday === undefined || r.weekday === weekday),
    )
    .map(({ weekday, startTime, endTime }) => ({
      weekday,
      startTime,
      endTime,
    }));
}
