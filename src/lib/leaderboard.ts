import "server-only";
import { db } from "@/lib/db";

/**
 * Test reytingidagi o'rin: faqat birinchi urinishlar (FINISHED/EXPIRED), faol o'quvchilar.
 * Tartib: score DESC, durationSec ASC; teng natijalar bir xil o'rin oladi (RANK()).
 * To'liq reyting 6-bosqichda shu faylga qo'shiladi.
 */
export async function getTestRank(attempt: {
  testId: string;
  isFirst: boolean;
  score: number | null;
  durationSec: number | null;
}): Promise<{ rank: number; total: number } | null> {
  if (
    !attempt.isFirst ||
    attempt.score === null ||
    attempt.durationSec === null
  )
    return null;

  const base = {
    testId: attempt.testId,
    isFirst: true,
    status: { in: ["FINISHED", "EXPIRED"] as ("FINISHED" | "EXPIRED")[] },
    user: { isActive: true },
  };
  const [better, total] = await Promise.all([
    db.attempt.count({
      where: {
        ...base,
        OR: [
          { score: { gt: attempt.score } },
          { score: attempt.score, durationSec: { lt: attempt.durationSec } },
        ],
      },
    }),
    db.attempt.count({ where: base }),
  ]);
  return { rank: better + 1, total };
}
