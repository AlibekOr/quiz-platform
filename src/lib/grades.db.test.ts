import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import {
  getSemesterGrades,
  getStudentSemesters,
  planPointCarryOver,
} from "./grades-data";
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

  it("avtomatik jarima: yangi uyga vazifaga 0 — −2, eskisiga −1, sababsiz kelmaslik −1, sababli va 0,5 — jarimasiz", async () => {
    const sid = await semester(groupId, -30, 30);
    const ali = await student("Ali", groupId);
    const bonus = await assignment(sid, "BONUS", 20);
    await grade(bonus, ali, 10);
    await grade(await assignment(sid, "HOMEWORK"), ali, 0);
    // 2026-10-15 gacha berilgan vazifa (migratsiyada missPenalty = 1)
    const old = await assignment(sid, "HOMEWORK");
    await db.assignment.update({
      where: { id: old },
      data: { missPenalty: 1 },
    });
    await grade(old, ali, 0);
    await grade(await assignment(sid, "HOMEWORK"), ali, 0.5);
    // PRACTICAL ga 0 — jarima emas
    await grade(await assignment(sid, "PRACTICAL", 5), ali, 0);
    const mark = async (
      offset: number,
      status: "ABSENT" | "EXCUSED" | "LATE",
    ) => {
      const lesson = await db.lesson.create({
        data: { groupId, date: day(offset) },
      });
      await db.attendance.create({
        data: { lessonId: lesson.id, studentId: ali, status },
      });
    };
    await mark(-3, "ABSENT");
    await mark(-2, "EXCUSED");
    await mark(-1, "LATE");
    // Semestrdan tashqarida — hisobga kirmaydi
    await mark(-40, "ABSENT");

    const a = (await getSemesterGrades(sid))!.students[0];
    expect(a.result.penalties).toBe(4);
    // 10 + 0,5 − (2 + 1 + 1)
    expect(a.result.total).toBe(6.5);
    expect(a.penalties.map((p) => [p.name, p.points, p.auto]).sort()).toEqual([
      ["Darsga sababsiz kelmadi", 1, true],
      ["Uyga vazifa bajarilmagan", 1, true],
      ["Uyga vazifa bajarilmagan", 2, true],
    ]);
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

describe("planPointCarryOver", () => {
  it("eski semestr jami yangi guruh semestriga, nol ball va guruhsiz — o'tkazilmaydi", async () => {
    const from = await semester(groupId, -30, 30);
    const to = await semester(otherGroupId, -10, 50);
    const ali = await student("Ali", groupId);
    const bek = await student("Bek", groupId);
    const bonus = await assignment(from, "BONUS", 10);
    await grade(bonus, ali, 7.5);

    const plan = await planPointCarryOver(
      [
        { id: ali, groupId },
        { id: bek, groupId },
        { id: "guruhsiz", groupId: null },
      ],
      otherGroupId,
      today,
    );
    expect(plan.noTarget).toBe(false);
    expect(plan.items).toEqual([
      {
        studentId: ali,
        semesterId: to,
        fromSemesterId: from,
        points: 7.5,
        reason: `"Frontend-1" guruhidan ko'chirildi (S-30)`,
      },
    ]);
  });

  it("yangi guruhda shu sanada semestr bo'lmasa — noTarget", async () => {
    await semester(groupId, -30, 30);
    const ali = await student("Ali", groupId);
    const plan = await planPointCarryOver(
      [{ id: ali, groupId }],
      otherGroupId,
      todayInTashkent(),
    );
    expect(plan).toEqual({ items: [], noTarget: true });
  });
});

describe("planPointCarryOver: qaytib o'tkazish", () => {
  it("avval shu semestrdan kelgan ball qaytarilmaydi", async () => {
    const a = await semester(groupId, -30, 30);
    const b = await semester(otherGroupId, -30, 30);
    const ali = await student("Ali", otherGroupId);
    // A dan B ga 20 ball ko'chirilgan, B da yana 5 ball to'plagan
    await db.pointAdjustment.create({
      data: {
        studentId: ali,
        semesterId: b,
        fromSemesterId: a,
        points: 20,
        reason: "ko'chirildi",
        createdById: teacherId,
      },
    });
    await grade(await assignment(b, "BONUS", 10), ali, 5);

    const plan = await planPointCarryOver(
      [{ id: ali, groupId: otherGroupId }],
      groupId,
      today,
    );
    expect(plan.items.map((i) => [i.semesterId, i.points])).toEqual([[a, 5]]);
  });
});
