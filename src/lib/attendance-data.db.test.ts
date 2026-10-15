import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import { getAttendanceReport, getLessonSheet } from "./attendance-data";
import { moveStudent } from "./memberships-data";
import { addDays, toDbDate, todayInTashkent } from "./time";

const today = todayInTashkent();

let groupId: string;
let otherGroupId: string;

async function student(fullName: string) {
  return (
    await db.user.create({
      data: {
        username: fullName.toLowerCase(),
        fullName,
        passwordHash: "x",
        groupId,
        memberships: {
          create: {
            groupId,
            joinedAt: new Date(`${addDays(today, -60)}T05:00:00Z`),
          },
        },
      },
    })
  ).id;
}

beforeEach(async () => {
  await resetDatabase();
  groupId = (await db.group.create({ data: { name: "Frontend-1" } })).id;
  otherGroupId = (await db.group.create({ data: { name: "Frontend-2" } })).id;
});

describe("guruhdan ketganlar davomatda", () => {
  it("o'tkazilgan va chiqarilgan o'quvchi eski hisobotda ham, eski dars varag'ida ham yo'q", async () => {
    const ali = await student("Ali");
    const bek = await student("Bek");
    const vali = await student("Vali");
    const lessonDay = addDays(today, -10);
    const lesson = await db.lesson.create({
      data: { groupId, date: toDbDate(lessonDay) },
    });
    for (const id of [ali, bek, vali])
      await db.attendance.create({
        data: { lessonId: lesson.id, studentId: id, status: "PRESENT" },
      });
    const at = new Date(`${addDays(today, -5)}T05:00:00Z`);
    await db.$transaction(async (tx) => {
      await moveStudent(tx, { studentId: bek, toGroupId: otherGroupId, at });
      await moveStudent(tx, { studentId: vali, toGroupId: null, at });
    });

    const report = await getAttendanceReport(
      groupId,
      addDays(today, -30),
      today,
    );
    expect(report.students.map((s) => s.id)).toEqual([ali]);

    const sheet = await getLessonSheet(groupId, lessonDay);
    expect(sheet?.rows.map((r) => r.studentId)).toEqual([ali]);

    // Eski yozuvlar bazada qoladi (profildagi davomat foizi uchun)
    expect(await db.attendance.count({ where: { lessonId: lesson.id } })).toBe(
      3,
    );
  });
});
