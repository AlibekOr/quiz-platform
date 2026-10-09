import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import {
  exemptBeforeTransfer,
  getPeriodGrades,
  getStudentGrades,
} from "./grades-data";
import { addDays, toDbDate, todayInTashkent } from "./time";

// Sanalar bugungi kunga nisbatan: muddati o'tgan / o'tmagan itemlar
const today = todayInTashkent();
const day = (offset: number) => toDbDate(addDays(today, offset));

let teacherId: string;
let groupId: string;
let otherGroupId: string;
let periodId: string;

async function student(fullName: string, gid: string) {
  return (
    await db.user.create({
      data: {
        username: fullName.toLowerCase(),
        fullName,
        passwordHash: "x",
        groupId: gid,
        memberships: {
          create: {
            groupId: gid,
            joinedAt: new Date(`${addDays(today, -30)}T05:00:00Z`),
          },
        },
      },
    })
  ).id;
}

async function finishedAttempt(userId: string, testId: string, score: number) {
  const now = new Date();
  await db.attempt.create({
    data: {
      userId,
      testId,
      isFirst: true,
      status: "FINISHED",
      score,
      maxScore: 10,
      durationSec: 60,
      startedAt: now,
      deadlineAt: new Date(now.getTime() + 600_000),
      finishedAt: now,
    },
  });
}

beforeEach(async () => {
  await resetDatabase();
  teacherId = (
    await db.user.create({
      data: {
        username: "teacher",
        fullName: "O'qituvchi",
        passwordHash: "x",
        role: "TEACHER",
      },
    })
  ).id;
  groupId = (await db.group.create({ data: { name: "Frontend-1" } })).id;
  otherGroupId = (await db.group.create({ data: { name: "Frontend-2" } })).id;
  periodId = (
    await db.period.create({
      data: {
        groupId,
        name: "Oktyabr",
        startDate: day(-20),
        endDate: day(20),
        passPercent: 60,
      },
    })
  ).id;
});

describe("getPeriodGrades", () => {
  it("vazifa, test (foiz × bal), tuzatish va jami", async () => {
    const ali = await student("Ali", groupId);
    const vali = await student("Vali", groupId);
    const hw = await db.homework.create({
      data: {
        periodId,
        title: "1-vazifa",
        dueDate: day(-2),
        maxPoints: 10,
        createdById: teacherId,
      },
    });
    const test = await db.test.create({
      data: {
        title: "1-test",
        durationMin: 10,
        createdById: teacherId,
        dueDate: day(-1),
        groups: { connect: { id: groupId } },
        periods: { create: { periodId, points: 20 } },
      },
    });
    await db.homeworkGrade.create({
      data: { homeworkId: hw.id, studentId: ali, points: 8 },
    });
    await finishedAttempt(ali, test.id, 7);
    await db.pointAdjustment.create({
      data: {
        studentId: ali,
        periodId,
        points: -2,
        reason: "Intizom",
        createdById: teacherId,
      },
    });

    const data = await getPeriodGrades(periodId);
    expect(data?.sheet.items.map((i) => i.title)).toEqual([
      "1-vazifa",
      "1-test",
    ]);
    const [a, v] = data!.sheet.students;
    expect(a).toMatchObject({
      fullName: "Ali",
      earned: 22,
      adjustment: -2,
      total: 20,
      max: 30,
      percent: 67,
      passed: true,
    });
    // Vali hech narsa qilmagan: ikkala item muddati o'tgan — 0
    expect(v).toMatchObject({ id: vali, total: 0, max: 30, passed: false });
    expect(v.cells.every((c) => c.kind === "points" && c.missing)).toBe(true);
  });

  it("boshqa guruhga ketgan o'quvchi belgi bilan qoladi", async () => {
    const ali = await student("Ali", groupId);
    const at = new Date(`${addDays(today, -5)}T00:00:00+05:00`);
    await db.$transaction([
      db.groupMembership.updateMany({
        where: { studentId: ali, leftAt: null },
        data: { leftAt: at },
      }),
      db.groupMembership.create({
        data: { studentId: ali, groupId: otherGroupId, joinedAt: at },
      }),
      db.user.update({ where: { id: ali }, data: { groupId: otherGroupId } }),
    ]);
    const data = await getPeriodGrades(periodId);
    expect(data?.sheet.students[0].departure).toMatchObject({
      kind: "moved",
      groupName: "Frontend-2",
    });
  });
});

describe("getStudentGrades", () => {
  it("varaqda faqat o'quvchining o'zi bo'ladi", async () => {
    const ali = await student("Ali", groupId);
    await student("Vali", groupId);
    const periods = await getStudentGrades(ali);
    expect(periods).toHaveLength(1);
    expect(periods[0].sheet.students.map((s) => s.id)).toEqual([ali]);
  });
});

describe("exemptBeforeTransfer", () => {
  it("o'tkazish kunidan oldin muddati tugaganlardan ozod qiladi, ishlangan testdan emas", async () => {
    const ali = await student("Ali", otherGroupId);
    const vali = await student("Vali", otherGroupId);
    const oldHw = await db.homework.create({
      data: {
        periodId,
        title: "Eski",
        dueDate: day(-3),
        maxPoints: 10,
        createdById: teacherId,
      },
    });
    await db.homework.create({
      data: {
        periodId,
        title: "Yangi",
        dueDate: day(3),
        maxPoints: 10,
        createdById: teacherId,
      },
    });
    const oldTest = await db.test.create({
      data: {
        title: "Eski test",
        durationMin: 10,
        createdById: teacherId,
        dueDate: day(-3),
        groups: { connect: [{ id: groupId }, { id: otherGroupId }] },
        periods: { create: { periodId, points: 10 } },
      },
    });
    await finishedAttempt(vali, oldTest.id, 9);

    const exempt = (studentIds: string[]) =>
      db.$transaction((tx) =>
        exemptBeforeTransfer(tx, {
          studentIds,
          groupId,
          date: today,
          reason: "O'tkazilgan",
          createdById: teacherId,
        }),
      );

    expect(await exempt([ali, vali])).toBe(3);
    const rows = await db.gradeExemption.findMany({
      select: { studentId: true, itemType: true, itemId: true },
    });
    expect(rows).toHaveLength(3);
    expect(rows).toEqual(
      expect.arrayContaining([
        { studentId: ali, itemType: "HOMEWORK", itemId: oldHw.id },
        { studentId: ali, itemType: "TEST", itemId: oldTest.id },
        { studentId: vali, itemType: "HOMEWORK", itemId: oldHw.id },
      ]),
    );
    // Qayta chaqirilsa takror yozilmaydi
    expect(await exempt([ali])).toBe(0);
  });
});
