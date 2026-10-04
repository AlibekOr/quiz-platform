"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { isValidDateStr, toDbDate, todayInTashkent } from "@/lib/time";
import {
  attendanceFormSchema,
  type AttendanceFormInput,
} from "@/lib/validators/attendance";

const idSchema = z.string().min(1).max(64);

export async function saveAttendance(
  groupId: string,
  date: string,
  input: AttendanceFormInput,
): Promise<ActionResult> {
  await requireTeacher();
  const gid = idSchema.parse(groupId);
  if (!isValidDateStr(date)) return { ok: false, error: "Sana noto'g'ri" };
  if (date > todayInTashkent())
    return {
      ok: false,
      error: "Kelajakdagi sana uchun davomat belgilab bo'lmaydi",
    };

  const parsed = attendanceFormSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Maydonlarni tekshiring";
    return parsed.error.issues.some(
      (i) => i.path[0] === "records" && i.path.length === 1,
    )
      ? { ok: false, error: message }
      : validationFailed(parsed.error);
  }
  const { topic, records } = parsed.data;

  const group = await db.group.findUnique({
    where: { id: gid },
    select: { id: true },
  });
  if (!group) return { ok: false, error: "Guruh topilmadi" };

  // Faqat shu guruhning hozirgi o'quvchilari yoki shu darsda allaqachon yozuvi borlar
  const lessonDate = toDbDate(date);
  const [members, existing] = await Promise.all([
    db.user.findMany({
      where: { role: "STUDENT", groupId: gid },
      select: { id: true },
    }),
    db.attendance.findMany({
      where: { lesson: { groupId: gid, date: lessonDate } },
      select: { studentId: true },
    }),
  ]);
  const allowed = new Set([
    ...members.map((m) => m.id),
    ...existing.map((e) => e.studentId),
  ]);
  if (records.some((r) => !allowed.has(r.studentId))) {
    return {
      ok: false,
      error:
        "Ro'yxatda guruhga tegishli bo'lmagan o'quvchi bor. Sahifani yangilang",
    };
  }

  await db.$transaction(async (tx) => {
    // Bir guruh + bir sana = bitta dars (birinchi saqlashda yaratiladi)
    const lesson = await tx.lesson.upsert({
      where: { groupId_date: { groupId: gid, date: lessonDate } },
      create: { groupId: gid, date: lessonDate, topic },
      update: { topic },
      select: { id: true },
    });
    for (const r of records) {
      const status = r.status as "PRESENT" | "ABSENT" | "LATE";
      await tx.attendance.upsert({
        where: {
          lessonId_studentId: { lessonId: lesson.id, studentId: r.studentId },
        },
        create: {
          lessonId: lesson.id,
          studentId: r.studentId,
          status,
          note: r.note,
        },
        update: { status, note: r.note },
      });
    }
  });

  revalidatePath("/teacher/attendance");
  revalidatePath(`/teacher/groups/${gid}/attendance`);
  return { ok: true, message: "Davomat saqlandi" };
}
