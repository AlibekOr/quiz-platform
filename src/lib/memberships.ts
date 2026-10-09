import { formatDate, todayInTashkent, type DateStr } from "@/lib/time";

// Guruh a'zoligi davrlari (GroupMembership). Sof funksiyalar — testlar bilan.
// A'zolik [from, to) oralig'idagi kunlarni qamraydi: o'tkazish kuni yangi guruhga tegishli.

export type MembershipPeriod = {
  /** Qo'shilgan kun (Toshkent), kiradi */
  from: DateStr;
  /** Chiqqan kun (Toshkent), kirmaydi; null — hozir ham a'zo */
  to: DateStr | null;
};

export function toPeriod(m: {
  joinedAt: Date;
  leftAt: Date | null;
}): MembershipPeriod {
  return {
    from: todayInTashkent(m.joinedAt),
    to: m.leftAt ? todayInTashkent(m.leftAt) : null,
  };
}

export function isMemberOn(
  periods: readonly MembershipPeriod[],
  date: DateStr,
): boolean {
  return periods.some((p) => p.from <= date && (p.to === null || date < p.to));
}

/**
 * Tarixdagi eng so'nggi qo'shilish yoki chiqish kuni (Toshkent). Yangi a'zolik bundan
 * oldin boshlansa, davrlar ustma-ust tushadi. Tarix bo'sh bo'lsa null.
 */
export function latestMembershipDay(
  memberships: readonly { joinedAt: Date; leftAt: Date | null }[],
): DateStr | null {
  let latest: DateStr | null = null;
  for (const m of memberships) {
    for (const d of [m.joinedAt, m.leftAt]) {
      if (!d) continue;
      const day = todayInTashkent(d);
      if (latest === null || day > latest) latest = day;
    }
  }
  return latest;
}

/** Guruhdan ketgan o'quvchi: boshqa guruhga o'tkazilgan yoki guruhsiz qolgan */
export type Departure =
  | { kind: "moved"; groupName: string; date: DateStr }
  | { kind: "removed"; date: DateStr };

/**
 * O'quvchi `groupId` guruhidan qanday ketgani (hozir ham a'zo bo'lsa null).
 * Oxirgi yopilgan a'zolikdan keyin shu kuni boshqa guruhda a'zolik ochilgan bo'lsa — o'tkazilgan.
 */
export function describeDeparture(
  groupId: string,
  memberships: readonly {
    groupId: string;
    groupName: string;
    joinedAt: Date;
    leftAt: Date | null;
  }[],
): Departure | null {
  const here = memberships.filter((m) => m.groupId === groupId);
  if (here.length === 0 || here.some((m) => m.leftAt === null)) return null;
  const last = here.reduce((a, b) => (b.leftAt! > a.leftAt! ? b : a));
  const date = todayInTashkent(last.leftAt!);
  const next = memberships.find(
    (m) => m.groupId !== groupId && todayInTashkent(m.joinedAt) === date,
  );
  return next
    ? { kind: "moved", groupName: next.groupName, date }
    : { kind: "removed", date };
}

/** "o'tkazilgan: Frontend-2, 10.10.2026" / "guruhdan chiqarilgan, 10.10.2026" */
export function departureLabel(d: Departure): string {
  return d.kind === "moved"
    ? `o'tkazilgan: ${d.groupName}, ${formatDate(d.date)}`
    : `guruhdan chiqarilgan, ${formatDate(d.date)}`;
}
