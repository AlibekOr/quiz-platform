import type { Prisma } from "@/generated/prisma/client";
import { formatMoment, toLocalDateTime } from "@/lib/time";

// Testning ochiq bo'lish oralig'i. Test o'quvchiga ochiq: isActive VA startsAt <= hozir < endsAt
// (berilmagan chegara — cheklovsiz). "Faollashtirish / To'xtatish" tugmasi ustun turadi.
// Oxiriga yaqin boshlangan urinish endsAt da tugaydi (attemptDeadline).

export type TestWindow = {
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

/** draft — o'chiq; upcoming — hali ochilmagan; open — ochiq; closed — muddati tugagan */
export type TestState = "draft" | "upcoming" | "open" | "closed";

export function testState(test: TestWindow, now: Date): TestState {
  if (!test.isActive) return "draft";
  if (test.startsAt && now < test.startsAt) return "upcoming";
  if (test.endsAt && now >= test.endsAt) return "closed";
  return "open";
}

/** Hozir boshlash mumkin bo'lgan testlar sharti (testState === "open" bilan bir xil) */
export function openTestWhere(now: Date): Prisma.TestWhereInput {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}

/** Urinish muddati: boshlangan vaqt + davomiylik, lekin test yopilishidan kech emas */
export function attemptDeadline(
  startedAt: Date,
  durationMin: number,
  endsAt: Date | null,
): Date {
  const byDuration = startedAt.getTime() + durationMin * 60_000;
  return new Date(endsAt ? Math.min(byDuration, endsAt.getTime()) : byDuration);
}

/**
 * Oraliqni qisqa yozadi: "Yakshanba, 18.10 · 10:00 – 11:00", "18:00 dan", "18:00 gacha".
 * Vaqt berilmagan bo'lsa null
 */
export function formatTestWindow(
  test: Pick<TestWindow, "startsAt" | "endsAt">,
  now: Date,
): string | null {
  const { startsAt, endsAt } = test;
  if (startsAt && endsAt) {
    const sameDay =
      toLocalDateTime(startsAt).slice(0, 10) ===
      toLocalDateTime(endsAt).slice(0, 10);
    const end = sameDay
      ? toLocalDateTime(endsAt).slice(11)
      : formatMoment(endsAt, now);
    return `${formatMoment(startsAt, now)} – ${end}`;
  }
  if (startsAt) return `${formatMoment(startsAt, now)} dan`;
  if (endsAt) return `${formatMoment(endsAt, now)} gacha`;
  return null;
}
