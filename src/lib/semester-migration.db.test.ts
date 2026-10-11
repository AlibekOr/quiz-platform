import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// semester_points migratsiyasi mavjud ma'lumotni yo'qotmasligi (TASKS.md, "Testlar").
// Test bazasida alohida sxemada: oldingi migratsiyalar -> eski ko'rinishdagi ma'lumot ->
// yangi migratsiya -> tekshiruv. "backup" sxemasi "mig_backup" ga almashtiriladi, shunda
// test bazasidagi haqiqiy zaxira jadvallariga tegilmaydi

const SCHEMA = "mig_semester";
const BACKUP = "mig_backup";
const TARGET = "semester_points";
const dir = join(process.cwd(), "prisma", "migrations");
const migrations = readdirSync(dir)
  .filter((d) => /^\d+_/.test(d))
  .sort();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function run(sql: string) {
  await client.query(sql);
}

async function rows<T>(sql: string): Promise<T[]> {
  return (await client.query(sql)).rows as T[];
}

beforeAll(async () => {
  if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL)
    throw new Error("Migratsiya testi faqat test bazasida ishlaydi");
  await client.connect();
  await run(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  await run(`DROP SCHEMA IF EXISTS "${BACKUP}" CASCADE`);
  await run(`CREATE SCHEMA "${SCHEMA}"`);
  await run(`SET search_path TO "${SCHEMA}"`);

  const target = migrations.findIndex((m) => m.endsWith(`_${TARGET}`));
  expect(target).toBeGreaterThan(0);
  for (const m of migrations.slice(0, target))
    await run(readFileSync(join(dir, m, "migration.sql"), "utf8"));

  // Eski ko'rinishdagi ma'lumot: davr, maxPoints=5 va 1 bo'lgan vazifalar, ballar,
  // testning davrga biriktirilishi va muddati, ozod qilish, butun sonli tuzatish
  await run(`
    INSERT INTO "User" (id, username, "fullName", "passwordHash", role)
      VALUES ('t1', 'teacher', 'O''qituvchi', 'x', 'TEACHER'),
             ('s1', 'ali', 'Ali', 'x', 'STUDENT');
    INSERT INTO "Group" (id, name) VALUES ('g1', 'Frontend-1');
    INSERT INTO "Period" (id, "groupId", name, "startDate", "endDate", "passPercent")
      VALUES ('p1', 'g1', 'Oktyabr', '2026-10-01', '2026-10-31', 60);
    INSERT INTO "Homework" (id, "periodId", title, "dueDate", "maxPoints", "createdById")
      VALUES ('h5', 'p1', 'Besh balli', '2026-10-05', 5, 't1'),
             ('h1', 'p1', 'Bir balli', '2026-10-06', 1, 't1');
    INSERT INTO "HomeworkGrade" (id, "homeworkId", "studentId", points, note, "gradedAt")
      VALUES ('gr5', 'h5', 's1', 3, 'yaxshi', now()),
             ('gr1', 'h1', 's1', 1, NULL, now());
    INSERT INTO "Test" (id, title, "durationMin", "createdById", "dueDate")
      VALUES ('test1', 'Test', 10, 't1', '2026-10-10');
    INSERT INTO "TestPeriod" (id, "testId", "periodId", points)
      VALUES ('tp1', 'test1', 'p1', 20);
    INSERT INTO "GradeExemption" (id, "studentId", "itemType", "itemId", reason, "createdById")
      VALUES ('ex1', 's1', 'TEST', 'test1', 'O''tkazilgan', 't1');
    INSERT INTO "PointAdjustment" (id, "studentId", "periodId", points, reason, "createdById")
      VALUES ('adj1', 's1', 'p1', -2, 'Intizom', 't1');
  `);

  const sql = readFileSync(
    join(dir, migrations[target], "migration.sql"),
    "utf8",
  ).replaceAll('"backup"', `"${BACKUP}"`);
  await run(sql);
});

afterAll(async () => {
  await run(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
  await run(`DROP SCHEMA IF EXISTS "${BACKUP}" CASCADE`);
  await client.end();
});

describe("semester_points migratsiyasi", () => {
  it("davr semestrga aylanadi, standart chegaralar bilan", async () => {
    const [p] = await rows<Record<string, unknown>>(`SELECT * FROM "Period"`);
    expect(p).toMatchObject({
      id: "p1",
      name: "Oktyabr",
      passPercent: 60,
      closed: false,
      maxTotal: 60,
      failBelow: 10,
      homeworkCap: 30,
      practicalCap: 20,
      oralCap: 10,
      extraCap: 40,
    });
  });

  it("vazifalar va ballar yo'qolmaydi: HOMEWORK, maxPoints = 1, ball 0.5 ga yaxlitlanadi", async () => {
    const hw = await rows<{ id: string; category: string; maxPoints: number }>(
      `SELECT id, category, "maxPoints" FROM "Homework" ORDER BY id`,
    );
    expect(hw).toEqual([
      { id: "h1", category: "HOMEWORK", maxPoints: 1 },
      { id: "h5", category: "HOMEWORK", maxPoints: 1 },
    ]);
    const grades = await rows<{ id: string; points: number; note: string }>(
      `SELECT id, points, note FROM "HomeworkGrade" ORDER BY id`,
    );
    // 3/5 = 0.6 -> 0.5; 1/1 -> 1; izoh saqlanadi
    expect(grades).toEqual([
      { id: "gr1", points: 1, note: null },
      { id: "gr5", points: 0.5, note: "yaxshi" },
    ]);
  });

  it("tuzatish saqlanadi (o'nli songa o'tadi)", async () => {
    const [a] = await rows<{ points: number; periodId: string }>(
      `SELECT points, "periodId" FROM "PointAdjustment"`,
    );
    expect(a).toEqual({ points: -2, periodId: "p1" });
  });

  it("olib tashlangan va o'zgargan ma'lumotlar zaxirada", async () => {
    const q = (t: string) => rows(`SELECT * FROM "${BACKUP}"."${t}"`);
    expect(await q("TestPeriod_20261011")).toEqual([
      { id: "tp1", testId: "test1", periodId: "p1", points: 20 },
    ]);
    const [due] = await rows<{ id: string; dueDate: Date }>(
      `SELECT id, "dueDate" FROM "${BACKUP}"."TestDueDate_20261011"`,
    );
    expect(due.id).toBe("test1");
    expect(await q("GradeExemption_20261011")).toMatchObject([
      { id: "ex1", itemType: "TEST", itemId: "test1", reason: "O'tkazilgan" },
    ]);
    const original = await rows<{ id: string; points: number }>(
      `SELECT id, points FROM "${BACKUP}"."HomeworkGrade_20261011" ORDER BY id`,
    );
    expect(original).toEqual([
      { id: "gr1", points: 1 },
      { id: "gr5", points: 3 },
    ]);
    const hw = await rows<{ id: string; maxPoints: number }>(
      `SELECT id, "maxPoints" FROM "${BACKUP}"."Homework_20261011" ORDER BY id`,
    );
    expect(hw).toEqual([
      { id: "h1", maxPoints: 1 },
      { id: "h5", maxPoints: 5 },
    ]);
  });

  it("testlar va urinishlar o'chmaydi, faqat muddati va davr biriktirishi ketadi", async () => {
    const tests = await rows<{ id: string }>(`SELECT id FROM "Test"`);
    expect(tests).toEqual([{ id: "test1" }]);
    const tables = await rows<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = '${SCHEMA}' AND table_name IN ('TestPeriod', 'GradeExemption', 'OralScore')`,
    );
    expect(tables.map((t) => t.table_name)).toEqual(["OralScore"]);
  });
});
