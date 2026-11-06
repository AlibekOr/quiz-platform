"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { canAccessStudent, FORBIDDEN } from "@/lib/auth/scope";
import { requireStaffScope, requireTeacherScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";
import { getRiskRows } from "@/lib/risk-data";
import { addDays, toDbDate, todayInTashkent } from "@/lib/time";
import {
  reviewSchema,
  riskSettingsSchema,
  type ReviewInput,
  type RiskSettingsInput,
} from "@/lib/validators/risk";

// Xavf ostidagi o'quvchilar: "Ko'rib chiqildi" (doiradagi xodim) va sozlamalar (o'qituvchi)

const idSchema = z.string().min(1).max(64);

function revalidate() {
  revalidatePath("/teacher", "layout");
  revalidatePath("/manager");
}

/** Hozirgi signallar eslab qolinadi: keyin yangi signal qo'shilsa — darhol yana yuqorida */
export async function markReviewed(
  studentId: string,
  input: ReviewInput,
): Promise<ActionResult> {
  const { user, scope } = await requireStaffScope();
  const id = idSchema.parse(studentId);
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  if (!(await canAccessStudent(scope, id))) return FORBIDDEN;

  const student = await db.user.findUnique({
    where: { id },
    select: { groupId: true },
  });
  const rows = student?.groupId
    ? await getRiskRows(scope, {
        forManager: user.role === "MANAGER",
        groupId: student.groupId,
      })
    : [];
  const signals =
    rows.find((r) => r.studentId === id)?.risk.signals.map((s) => s.kind) ?? [];
  await db.riskReview.create({
    data: {
      studentId: id,
      reviewedById: user.id,
      note: parsed.data.note,
      signalKinds: signals,
      hideUntil: toDbDate(addDays(todayInTashkent(), parsed.data.days)),
    },
  });
  revalidate();
  return { ok: true, message: "Ko'rib chiqildi deb belgilandi" };
}

export async function saveRiskSettings(
  input: RiskSettingsInput,
): Promise<ActionResult> {
  const { user } = await requireTeacherScope();
  const parsed = riskSettingsSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);
  await db.riskSettings.upsert({
    where: { teacherId: user.id },
    update: parsed.data,
    create: { ...parsed.data, teacherId: user.id },
  });
  revalidate();
  return {
    ok: true,
    message: "Sozlamalar saqlandi (ro'yxat 5 daqiqa ichida yangilanadi)",
  };
}
