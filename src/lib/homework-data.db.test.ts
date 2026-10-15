import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import {
  getHomeworkPrefill,
  lessonTaskMismatch,
  getMissingHomeworkLessons,
  getStudentAssignments,
  lessonMismatch,
} from "./homework-data";
import {
  addDays,
  startOfDayInTashkent,
  toDbDate,
  todayInTashkent,
  weekdayOf,
} from "./time";

const today = todayInTashkent();
const day = (offset: number) => toDbDate(addDays(today, offset));

let teacherId: string;
let groupId: string;
let otherGroupId: string;
let semesterId: string;

async function lesson(gid: string, offset: number) {
  return (await db.lesson.create({ data: { groupId: gid, date: day(offset) } }))
    .id;
}

async function assignment(
  data: {
    lessonId?: string;
    category?: "HOMEWORK" | "PRACTICAL" | "EXTRA" | "BONUS";
    semesterId?: string;
  } = {},
) {
  return (
    await db.assignment.create({
      data: {
        semesterId: data.semesterId ?? semesterId,
        category: data.category ?? "HOMEWORK",
        lessonId: data.lessonId,
        title: "Vazifa",
        dueDate: day(2),
        maxPoints: 1,
        createdById: teacherId,
      },
    })
  ).id;
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
  semesterId = (
    await db.semester.create({
      data: {
        groupId,
        name: "1-semestr",
        startDate: day(-20),
        endDate: day(20),
      },
    })
  ).id;
});

describe("lessonMismatch", () => {
  it("shu guruh va semestr ichidagi dars — xato yo'q", async () => {
    expect(await lessonMismatch(await lesson(groupId, -1), semesterId)).toBe(
      null,
    );
  });

  it("boshqa guruh darsi rad etiladi", async () => {
    expect(
      await lessonMismatch(await lesson(otherGroupId, -1), semesterId),
    ).toBe("Dars boshqa guruhga tegishli");
  });

  it("semestrdan tashqaridagi dars rad etiladi", async () => {
    expect(await lessonMismatch(await lesson(groupId, -30), semesterId)).toBe(
      "Dars semestr sanalaridan tashqarida",
    );
  });
});

describe("getMissingHomeworkLessons", () => {
  it("vazifa bog'langan va semestrdan tashqari darslar chiqmaydi", async () => {
    const without = await lesson(groupId, -1);
    const withHw = await lesson(groupId, -3);
    await assignment({ lessonId: withHw });
    // Amaliy berilgan dars — u uyga vazifa o'rnida, eslatma chiqmaydi
    const practical = await lesson(groupId, -5);
    await assignment({ lessonId: practical, category: "PRACTICAL" });
    // Faqat bonus berilgan dars — uyga vazifa hali yo'q
    const bonus = await lesson(groupId, -6);
    await assignment({ lessonId: bonus, category: "BONUS" });
    // Semestri yo'q guruh darsi — vazifa berib bo'lmaydi
    await lesson(otherGroupId, -1);

    const missing = await getMissingHomeworkLessons(14, today);
    expect(missing.map((m) => m.lessonId)).toEqual([without, bonus]);
    expect(missing[0]).toMatchObject({
      groupId,
      semesterId,
      lessonDate: addDays(today, -1),
    });
  });

  it("muddat jadval bo'yicha keyingi dars", async () => {
    const lessonId = await lesson(groupId, 0);
    const next = addDays(today, 2);
    await db.groupSchedule.create({
      data: {
        groupId,
        weekday: weekdayOf(next),
        startTime: "14:00",
        endTime: "16:00",
      },
    });
    const p = await getHomeworkPrefill(lessonId);
    expect(p?.dueDate).toBe(next);
  });

  it("vazifa berilgan darsga taklif chiqmaydi", async () => {
    const lessonId = await lesson(groupId, 0);
    await assignment({ lessonId });
    expect(await getHomeworkPrefill(lessonId)).toBeNull();
  });

  it("amaliy berilgan darsga taklif chiqmaydi", async () => {
    const lessonId = await lesson(groupId, 0);
    await assignment({ lessonId, category: "PRACTICAL" });
    expect(await getHomeworkPrefill(lessonId)).toBeNull();
  });
});

describe("lessonTaskMismatch", () => {
  it("amaliy bor darsga uyga vazifa, uyga vazifa bor darsga amaliy berilmaydi", async () => {
    const withPractical = await lesson(groupId, -1);
    const practical = await assignment({
      lessonId: withPractical,
      category: "PRACTICAL",
    });
    expect(await lessonTaskMismatch(withPractical, "HOMEWORK")).toMatch(
      /amaliy topshiriq berilgan/,
    );
    // O'zini tahrirlash va boshqa toifalar — mumkin
    expect(
      await lessonTaskMismatch(withPractical, "PRACTICAL", practical),
    ).toBeNull();
    expect(await lessonTaskMismatch(withPractical, "BONUS")).toBeNull();
    // Yagona uyga vazifani amaliyga aylantirish — mumkin
    const withHw = await lesson(groupId, -2);
    const hw = await assignment({ lessonId: withHw });
    expect(await lessonTaskMismatch(withHw, "PRACTICAL")).toMatch(
      /uyga vazifa berilgan/,
    );
    expect(await lessonTaskMismatch(withHw, "PRACTICAL", hw)).toBeNull();
  });
});

describe("getStudentAssignments", () => {
  it("faqat o'z guruhi, faqat o'z bali; EXTRA faqat o'ziga qo'yilgan bo'lsa", async () => {
    const ali = await db.user.create({
      data: { username: "ali", fullName: "Ali", passwordHash: "x", groupId },
    });
    const vali = await db.user.create({
      data: { username: "vali", fullName: "Vali", passwordHash: "x", groupId },
    });
    const hw = await assignment();
    const extra = await assignment({ category: "EXTRA" });
    const otherSemester = await db.semester.create({
      data: {
        groupId: otherGroupId,
        name: "Boshqa",
        startDate: day(-20),
        endDate: day(20),
      },
    });
    await assignment({ semesterId: otherSemester.id });
    await db.assignmentGrade.createMany({
      data: [
        { assignmentId: hw, studentId: ali.id, points: 1, note: "zo'r" },
        { assignmentId: hw, studentId: vali.id, points: 0.5 },
        { assignmentId: extra, studentId: vali.id, points: 5 },
      ],
    });

    const mine = await getStudentAssignments(ali.id, groupId);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ id: hw, points: 1, note: "zo'r" });

    const valis = await getStudentAssignments(vali.id, groupId);
    expect(valis.map((a) => a.id).sort()).toEqual([extra, hw].sort());
    expect(valis.find((a) => a.id === hw)?.points).toBe(0.5);
  });

  it("guruhga qo'shilishdan oldin muddati tugagan, baholanmagan vazifa ko'rinmaydi", async () => {
    const ali = await db.user.create({
      data: {
        username: "ali",
        fullName: "Ali",
        passwordHash: "x",
        groupId,
        memberships: {
          create: {
            groupId,
            joinedAt: startOfDayInTashkent(addDays(today, -5)),
          },
        },
      },
    });
    const old = await assignment();
    const gradedOld = await assignment();
    const fresh = await assignment();
    await db.assignment.updateMany({
      where: { id: { in: [old, gradedOld] } },
      data: { dueDate: day(-10) },
    });
    await db.assignmentGrade.create({
      data: { assignmentId: gradedOld, studentId: ali.id, points: 1 },
    });

    const list = await getStudentAssignments(ali.id, groupId);
    expect(list.map((a) => a.id).sort()).toEqual([fresh, gradedOld].sort());
  });
});
