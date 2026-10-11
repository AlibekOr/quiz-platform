import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { resetDatabase } from "@/test/db";
import { getSemesterGrades } from "./grades-data";
import { applyPenalty, getActivePenaltyTypes } from "./penalties";
import { addDays, toDbDate, todayInTashkent } from "./time";

const today = todayInTashkent();
const day = (offset: number) => toDbDate(addDays(today, offset));

let teacherId: string;
let groupId: string;
let semesterId: string;
let lateId: string;

async function student(username: string, gid = groupId) {
  return (
    await db.user.create({
      data: {
        username,
        fullName: username,
        passwordHash: "x",
        groupId: gid,
        memberships: {
          create: {
            groupId: gid,
            joinedAt: new Date(`${addDays(today, -60)}T05:00:00Z`),
          },
        },
      },
    })
  ).id;
}

const base = () => ({
  semesterId,
  typeId: lateId,
  points: null,
  note: null,
  date: today,
  createdById: teacherId,
});

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
  semesterId = (
    await db.semester.create({
      data: {
        groupId,
        name: "1-semestr",
        startDate: day(-30),
        endDate: day(30),
      },
    })
  ).id;
  lateId = (
    await db.penaltyType.create({
      data: { name: "Darsga kechikish", defaultPoints: 1 },
    })
  ).id;
});

describe("applyPenalty", () => {
  it("bir shablon bir nechta o'quvchiga, ball shablondan nusxa", async () => {
    const ali = await student("ali");
    const vali = await student("vali");
    const r = await applyPenalty({ ...base(), studentIds: [ali, vali] });
    expect(r).toEqual({ ok: true, count: 2 });

    // Shablon o'zgarsa, eski jarima o'zgarmaydi
    await db.penaltyType.update({
      where: { id: lateId },
      data: { defaultPoints: 3 },
    });
    const rows = await db.penalty.findMany({ select: { points: true } });
    expect(rows.map((p) => p.points)).toEqual([1, 1]);
  });

  it("ball va izohni o'zgartirish mumkin", async () => {
    const ali = await student("ali");
    await applyPenalty({
      ...base(),
      studentIds: [ali],
      points: 2.5,
      note: "20 daqiqa",
    });
    const p = await db.penalty.findFirstOrThrow();
    expect(p).toMatchObject({ points: 2.5, note: "20 daqiqa" });
  });

  it("nofaol shablon tanlanmaydi va qo'llanmaydi", async () => {
    const ali = await student("ali");
    await db.penaltyType.update({
      where: { id: lateId },
      data: { isActive: false },
    });
    expect(await getActivePenaltyTypes()).toEqual([]);
    const r = await applyPenalty({ ...base(), studentIds: [ali] });
    expect(r.ok).toBe(false);
  });

  it("semestrda guruhda bo'lmagan o'quvchiga qo'yilmaydi", async () => {
    const other = await db.group.create({ data: { name: "Frontend-2" } });
    const begona = await student("begona", other.id);
    const r = await applyPenalty({ ...base(), studentIds: [begona] });
    expect(r.ok).toBe(false);
    expect(await db.penalty.count()).toBe(0);
  });

  it("kelajakdagi sana rad etiladi", async () => {
    const ali = await student("ali");
    const r = await applyPenalty({
      ...base(),
      studentIds: [ali],
      date: addDays(today, 1),
    });
    expect(r.ok).toBe(false);
  });

  it("semestrdan tashqaridagi sana rad etiladi", async () => {
    const ali = await student("ali");
    const r = await applyPenalty({
      ...base(),
      studentIds: [ali],
      date: addDays(today, -365),
    });
    expect(r).toEqual({
      ok: false,
      error: "Jarima sanasi semestr ichida bo'lsin",
    });
  });
});

describe("jarima semestr jamida", () => {
  it("60 lik chegaradan keyin ayiriladi va 0 dan pastga tushmaydi", async () => {
    const ali = await student("ali");
    const vali = await student("vali");
    const bonus = await db.assignment.create({
      data: {
        semesterId,
        category: "BONUS",
        title: "Bonus",
        dueDate: day(-1),
        maxPoints: 100,
        createdById: teacherId,
      },
    });
    // Ali: 70 bonus -> 60, jarima 2 -> 58
    await db.assignmentGrade.create({
      data: { assignmentId: bonus.id, studentId: ali, points: 70 },
    });
    await applyPenalty({ ...base(), studentIds: [ali, vali], points: 2 });

    const data = await getSemesterGrades(semesterId);
    const byName = new Map(data!.students.map((s) => [s.fullName, s]));
    expect(byName.get("ali")!.result.total).toBe(58);
    expect(byName.get("ali")!.penalties).toMatchObject([
      { points: 2, name: "Darsga kechikish", date: today },
    ]);
    // Vali: 0 − 2 -> 0
    expect(byName.get("vali")!.result.total).toBe(0);
  });
});
