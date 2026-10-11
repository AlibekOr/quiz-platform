import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import { getSemesterGrades, getStudentSemesters } from "./grades-data";
import { addDays, toDbDate, todayInTashkent } from "./time";

// Sanalar bugungi kunga nisbatan: davom etayotgan va tugagan semestrlar
const today = todayInTashkent();
const day = (offset: number) => toDbDate(addDays(today, offset));

let teacherId: string;
let groupId: string;
let otherGroupId: string;

async function student(fullName: string, gid: string, joinedDaysAgo = 60) {
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
            joinedAt: new Date(`${addDays(today, -joinedDaysAgo)}T05:00:00Z`),
          },
        },
      },
    })
  ).id;
}

async function semester(gid: string, from: number, to: number, closed = false) {
  return (
    await db.semester.create({
      data: {
        groupId: gid,
        name: `S${from}`,
        startDate: day(from),
        endDate: day(to),
        closed,
      },
    })
  ).id;
}

async function assignment(
  semesterId: string,
  category: "HOMEWORK" | "PRACTICAL" | "EXTRA" | "BONUS",
  maxPoints = 1,
) {
  return (
    await db.assignment.create({
      data: {
        semesterId,
        category,
        title: `${category}-${Math.random().toString(36).slice(2, 6)}`,
        dueDate: day(-5),
        maxPoints,
        createdById: teacherId,
      },
    })
  ).id;
}

async function grade(assignmentId: string, studentId: string, points: number) {
  await db.assignmentGrade.create({
    data: { assignmentId, studentId, points },
  });
}

async function oral(
  gid: string,
  offset: number,
  studentId: string,
  points: number,
) {
  const lesson = await db.lesson.upsert({
    where: { groupId_date: { groupId: gid, date: day(offset) } },
    create: { groupId: gid, date: day(offset) },
    update: {},
  });
  await db.oralScore.create({
    data: { lessonId: lesson.id, studentId, points, createdById: teacherId },
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
});

describe("getSemesterGrades", () => {
  it("kategoriyalar, og'zaki, tuzatish va chegaralar bilan jami", async () => {
    const sid = await semester(groupId, -30, 30);
    const ali = await student("Ali", groupId);
    const hw1 = await assignment(sid, "HOMEWORK");
    const hw2 = await assignment(sid, "HOMEWORK");
    const pr = await assignment(sid, "PRACTICAL", 25);
    const bonus = await assignment(sid, "BONUS", 5);
    await grade(hw1, ali, 1);
    await grade(hw2, ali, 0.5);
    await grade(pr, ali, 24); // chegara 20
    await grade(bonus, ali, 3);
    await oral(groupId, -3, ali, 1);
    await oral(groupId, -2, ali, 0.5);
    // Semestrdan tashqaridagi og'zaki ball hisobga kirmaydi
    await oral(groupId, -40, ali, 1);
    await db.pointAdjustment.create({
      data: {
        studentId: ali,
        semesterId: sid,
        points: 2.5,
        reason: "Boshqa guruhdan",
        createdById: teacherId,
      },
    });

    const data = await getSemesterGrades(sid);
    const a = data!.students[0];
    expect(a.result.categories.HOMEWORK.earned).toBe(1.5);
    expect(a.result.categories.PRACTICAL).toEqual({
      earned: 24,
      cap: 20,
      counted: 20,
    });
    expect(a.result.categories.ORAL.earned).toBe(1.5);
    expect(a.result.categories.BONUS.earned).toBe(3);
    expect(a.result.adjustments).toBe(2.5);
    // 1.5 + 20 + 1.5 + 3 + 2.5
    expect(a.result.total).toBe(28.5);
    expect(a.result.status).toBe("IN_PROGRESS");
    expect(a.oral).toHaveLength(2);
  });

  it("tugagan semestr: holat va EXTRA ruxsati", async () => {
    const sid = await semester(groupId, -60, -1);
    await student("Ali", groupId, 90);
    const vali = await student("Vali", groupId, 90);
    const aliId = (
      await db.user.findUniqueOrThrow({ where: { username: "ali" } })
    ).id;
    const hw = await Promise.all(
      Array.from({ length: 12 }, () => assignment(sid, "HOMEWORK")),
    );
    // Ali: 12 ball (qo'shimcha imkoniyat), Vali: 9.5 (yiqildi)
    for (const id of hw) await grade(id, aliId, 1);
    for (const id of hw.slice(0, 9)) await grade(id, vali, 1);
    await grade(hw[9], vali, 0.5);

    const data = await getSemesterGrades(sid);
    const byName = new Map(data!.students.map((s) => [s.fullName, s]));
    expect(data!.semester.ended).toBe(true);
    expect(byName.get("Ali")!.result).toMatchObject({
      total: 12,
      status: "EXTRA_CHANCE",
      canReceiveExtra: true,
    });
    expect(byName.get("Vali")!.result).toMatchObject({
      total: 9.5,
      status: "FAILED",
      canReceiveExtra: false,
    });
  });

  it("yopilgan semestr muddatidan oldin ham tugagan hisoblanadi", async () => {
    const sid = await semester(groupId, -30, 30, true);
    await student("Ali", groupId);
    const data = await getSemesterGrades(sid);
    expect(data!.semester.ended).toBe(true);
    expect(data!.students[0].result.status).toBe("FAILED");
  });

  it("faqat semestr davrida guruhda bo'lganlar; studentIds bilan filtr", async () => {
    const sid = await semester(groupId, -30, 30);
    const ali = await student("Ali", groupId);
    await student("Boshqa", otherGroupId);
    const all = await getSemesterGrades(sid);
    expect(all!.students.map((s) => s.fullName)).toEqual(["Ali"]);
    const filtered = await getSemesterGrades(sid, [ali, "begona-id"]);
    expect(filtered!.students).toHaveLength(1);
  });
});

describe("getStudentSemesters", () => {
  it("o'quvchi faqat o'zini ko'radi", async () => {
    const sid = await semester(groupId, -30, 30);
    const ali = await student("Ali", groupId);
    const vali = await student("Vali", groupId);
    const hw = await assignment(sid, "HOMEWORK");
    await grade(hw, ali, 1);
    await grade(hw, vali, 0.5);

    const mine = await getStudentSemesters(ali);
    expect(mine).toHaveLength(1);
    expect(mine[0].students.map((s) => s.id)).toEqual([ali]);
    expect(Object.keys(mine[0].students[0].grades)).toEqual([hw]);
    expect(mine[0].students[0].grades[hw].points).toBe(1);
  });

  it("boshqa guruh semestrlari ko'rinmaydi", async () => {
    await semester(otherGroupId, -30, 30);
    const ali = await student("Ali", groupId);
    expect(await getStudentSemesters(ali)).toEqual([]);
  });
});
