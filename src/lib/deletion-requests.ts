import "server-only";
import type { ActionResult } from "@/lib/action-result";
import {
  canAccessStudent,
  FORBIDDEN,
  getScope,
  type ScopeUser,
} from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";

// O'chirish so'rovlari (PLAN.md, 13-bosqich). Menejer o'quvchini o'chira olmaydi —
// faqat so'raydi; o'qituvchi tasdiqlasa o'quvchi arxivlanadi. Bitta o'quvchiga bir vaqtda
// faqat bitta PENDING so'rov (bazada qisman unique indeks ham bor)

const ALREADY_PENDING: ActionResult = {
  ok: false,
  error: "Bu o'quvchi uchun so'rov allaqachon kutilmoqda",
};

export async function requestDeletion(
  actor: ScopeUser,
  studentId: string,
  reason: string,
): Promise<ActionResult> {
  if (actor.role !== "MANAGER") return FORBIDDEN;
  if (!(await canAccessStudent(await getScope(actor), studentId)))
    return FORBIDDEN;

  const pending = await db.deletionRequest.count({
    where: { studentId, status: "PENDING" },
  });
  if (pending > 0) return ALREADY_PENDING;
  try {
    await db.deletionRequest.create({
      data: { studentId, requestedById: actor.id, reason },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return ALREADY_PENDING;
    throw e;
  }
  return { ok: true, message: "O'chirish so'rovi yuborildi" };
}

/**
 * Faqat o'qituvchi. Tasdiqlash o'quvchini arxivlaydi (sessiyalari ham yopiladi),
 * rad etishda izoh majburiy. Faqat PENDING so'rov hal qilinadi.
 */
export async function decideDeletionRequest(
  actor: ScopeUser,
  requestId: string,
  decision: { approve: boolean; note: string | null },
): Promise<ActionResult> {
  if (actor.role !== "TEACHER") return FORBIDDEN;
  if (!decision.approve && !decision.note)
    return {
      ok: false,
      error: "Maydonlarni tekshiring",
      fieldErrors: { note: ["Rad etish sababini yozing"] },
    };

  const request = await db.deletionRequest.findUnique({
    where: { id: requestId },
    select: { status: true, studentId: true },
  });
  if (!request) return { ok: false, error: "So'rov topilmadi" };
  if (request.status !== "PENDING")
    return { ok: false, error: "So'rov allaqachon hal qilingan" };

  const now = new Date();
  const decided = await db.$transaction(async (tx) => {
    // Bir vaqtda ikki marta bosilsa ham bitta qaror yoziladi
    const { count } = await tx.deletionRequest.updateMany({
      where: { id: requestId, status: "PENDING" },
      data: {
        status: decision.approve ? "APPROVED" : "REJECTED",
        decidedById: actor.id,
        decidedAt: now,
        decisionNote: decision.note,
      },
    });
    if (count === 1 && decision.approve) {
      await tx.user.updateMany({
        where: { id: request.studentId, role: "STUDENT", archivedAt: null },
        data: { archivedAt: now, sessionVersion: { increment: 1 } },
      });
    }
    return count === 1;
  });
  if (!decided) return { ok: false, error: "So'rov allaqachon hal qilingan" };
  return {
    ok: true,
    message: decision.approve
      ? "Tasdiqlandi: o'quvchi arxivlandi"
      : "So'rov rad etildi",
  };
}
