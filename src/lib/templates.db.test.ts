import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { DEFAULT_TEMPLATE } from "@/lib/grades";
import { getSemesterGrades } from "@/lib/grades-data";
import {
  createSemesterFromTemplate,
  ensureDefaultTemplate,
  saveTemplate,
} from "@/lib/templates";
import { addDays, todayInTashkent } from "@/lib/time";
import { templateSchema } from "@/lib/validators/grades";
import { resetDatabase } from "@/test/db";

// Baholash shablonlari (ROLES.md §5, §9): snapshot, standart shablon, validatsiya va
// grading_templates migratsiyasi mavjud ballarni o'zgartirmasligi

const today = todayInTashkent();
let teacherId: string;
let groupId: string;

beforeEach(async () => {
  await resetDatabase();
  teacherId = (
    await db.user.create({
      data: {
        username: "alibek",
        fullName: "Orakbaev Alibek",
        passwordHash: "x",
        role: "TEACHER",
      },
    })
  ).id;
  groupId = (await db.group.create({ data: { teacherId, name: "G1" } })).id;
});

async function semesterFrom(templateId: string, name = "1-semestr") {
  const r = await createSemesterFromTemplate({
    groupId,
    ownerId: teacherId,
    templateId,
    name,
    startDate: addDays(today, -30),
    endDate: addDays(today, 60),
    closed: false,
  });
  if (!r.ok) throw new Error("semestr yaratilmadi");
  return r.id;
}

describe("standart shablon va snapshot", () => {
  it("o'qituvchiga standart shablon bir marta yaratiladi", async () => {
    await ensureDefaultTemplate(teacherId);
    await ensureDefaultTemplate(teacherId);
    const templates = await db.gradingTemplate.findMany({
      where: { ownerId: teacherId },
      include: { categories: { orderBy: { order: "asc" } } },
    });
    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({
      name: "Asosiy",
      maxTotal: 60,
      passPercent: 60,
      failBelow: 10,
      extraMode: "AFTER_END_BAND",
      extraBeyondMax: false,
      isDefault: true,
    });
    expect(templates[0].categories.map((c) => [c.kind, c.cap])).toEqual([
      ["HOMEWORK", 30],
      ["PRACTICAL", 20],
      ["ORAL", 10],
      ["EXTRA", 40],
      ["BONUS", null],
    ]);
  });

  it("shablon o'zgarsa yoki o'chsa, semestr qoidalari va ballari o'zgarmaydi", async () => {
    await ensureDefaultTemplate(teacherId);
    const template = await db.gradingTemplate.findFirstOrThrow({
      where: { ownerId: teacherId },
    });
    const semesterId = await semesterFrom(template.id);
    const before = await getSemesterGrades(semesterId);

    await saveTemplate(
      teacherId,
      {
        ...DEFAULT_TEMPLATE,
        name: "Asosiy",
        maxTotal: 100,
        isDefault: true,
        categories: [
          {
            name: "Loyiha",
            kind: "ASSIGNMENT",
            cap: 100,
            itemMin: 0,
            itemMax: 50,
            step: 1,
          },
        ],
      },
      template.id,
    );
    const after = await getSemesterGrades(semesterId);
    expect(after?.semester.rules).toEqual(before?.semester.rules);
    expect(after?.semester.rules.maxTotal).toBe(60);

    await db.gradingTemplate.delete({ where: { id: template.id } });
    const orphan = await db.semester.findUniqueOrThrow({
      where: { id: semesterId },
      include: { categories: true },
    });
    expect(orphan.templateId).toBeNull();
    expect(orphan.categories).toHaveLength(5);
  });

  it("boshqa o'qituvchining shablonidan semestr yaratib bo'lmaydi", async () => {
    const other = await db.user.create({
      data: {
        username: "b",
        fullName: "B",
        passwordHash: "x",
        role: "TEACHER",
      },
    });
    await ensureDefaultTemplate(other.id);
    const foreign = await db.gradingTemplate.findFirstOrThrow({
      where: { ownerId: other.id },
    });
    expect(
      await createSemesterFromTemplate({
        groupId,
        ownerId: teacherId,
        templateId: foreign.id,
        name: "X",
        startDate: today,
        endDate: today,
        closed: false,
      }),
    ).toEqual({ ok: false });
  });

  it("semestr o'chsa topshiriqlari va kategoriyalari birga o'chadi", async () => {
    await ensureDefaultTemplate(teacherId);
    const template = await db.gradingTemplate.findFirstOrThrow({
      where: { ownerId: teacherId },
    });
    const semesterId = await semesterFrom(template.id);
    const category = await db.semesterCategory.findFirstOrThrow({
      where: { semesterId, kind: "HOMEWORK" },
    });
    await db.assignment.create({
      data: {
        semesterId,
        category: "HOMEWORK",
        categoryId: category.id,
        title: "UV",
        dueDate: new Date(`${today}T00:00:00Z`),
        maxPoints: 1,
        createdById: teacherId,
      },
    });
    await db.semester.delete({ where: { id: semesterId } });
    expect(await db.semesterCategory.count()).toBe(0);
    expect(await db.assignment.count()).toBe(0);
  });
});

describe("shablon validatsiyasi", () => {
  const valid = { ...DEFAULT_TEMPLATE, name: "Asosiy", isDefault: true };
  const ok = (patch: object) =>
    templateSchema.safeParse({ ...valid, ...patch }).success;
  const withCategory = (c: object) =>
    ok({ categories: [{ ...DEFAULT_TEMPLATE.categories[1], ...c }] });

  it("standart shablon to'g'ri", () => {
    expect(ok({})).toBe(true);
  });

  it("failBelow < o'tish bali <= maxTotal", () => {
    expect(ok({ failBelow: 36 })).toBe(false);
    expect(ok({ failBelow: 35 })).toBe(true);
    expect(ok({ passPercent: 101 })).toBe(false);
  });

  it("itemMin <= itemMax, qadam 0,5 yoki 1, chegara >= 0 yoki chegarasiz", () => {
    expect(withCategory({ itemMin: 5, itemMax: 2 })).toBe(false);
    expect(withCategory({ step: 0.25 })).toBe(false);
    expect(withCategory({ cap: -1 })).toBe(false);
    expect(withCategory({ cap: null })).toBe(true);
    // Og'zaki — doim 0 / 0,5 / 1
    expect(withCategory({ kind: "ORAL", itemMax: 2 })).toBe(false);
  });

  it("maxsus turlar bittadan, nomlar takrorlanmaydi; o'z kategoriyalari — istalgancha", () => {
    const homework = DEFAULT_TEMPLATE.categories[0];
    expect(ok({ categories: [homework, { ...homework, name: "UV 2" }] })).toBe(
      false,
    );
    expect(
      ok({
        categories: [
          { ...homework, kind: "ASSIGNMENT" },
          { ...homework, kind: "ASSIGNMENT" },
        ],
      }),
    ).toBe(false);
    expect(
      ok({
        categories: [
          {
            name: "Loyiha",
            kind: "ASSIGNMENT",
            cap: 20,
            itemMin: 0,
            itemMax: 20,
            step: 1,
          },
          {
            name: "Nazorat",
            kind: "ASSIGNMENT",
            cap: 20,
            itemMin: 0,
            itemMax: 10,
            step: 0.5,
          },
        ],
      }),
    ).toBe(true);
  });
});

// ---------- grading_templates migratsiyasi ----------

const SCHEMA = "mig_templates";
const BACKUP = "mig_templates_backup";
const dir = join(process.cwd(), "prisma", "migrations");
const migrations = readdirSync(dir)
  .filter((d) => /^\d+_/.test(d))
  .sort();
const target = migrations.findIndex((m) => m.endsWith("_grading_templates"));
const read = (m: string) =>
  readFileSync(join(dir, m, "migration.sql"), "utf8").replaceAll(
    '"backup"',
    `"${BACKUP}"`,
  );
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

describe("grading_templates migratsiyasi", () => {
  beforeAll(async () => {
    await client.connect();
    await client.query(`DROP SCHEMA IF EXISTS "${BACKUP}" CASCADE`);
    await client.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await client.query(`CREATE SCHEMA "${SCHEMA}"`);
    await client.query(`SET search_path TO "${SCHEMA}"`);
    expect(target).toBeGreaterThan(0);
    for (const m of migrations.slice(0, target)) await client.query(read(m));
    // Prod'ga o'xshash: o'qituvchi uyga vazifa chegarasini 25 qilib o'zgartirgan semestr
    await client.query(`
      INSERT INTO "User" (id, username, "fullName", "passwordHash", role)
        VALUES ('t1', 'alibek', 'Orakbaev Alibek', 'x', 'TEACHER'),
               ('s1', 'ali', 'Ali', 'x', 'STUDENT');
      INSERT INTO "Group" (id, name, "teacherId") VALUES ('g1', 'G1', 't1');
      INSERT INTO "Period" (id, "groupId", name, "startDate", "endDate", "homeworkCap")
        VALUES ('p1', 'g1', '1-semestr', '2026-09-01', '2026-12-31', 25);
      INSERT INTO "Homework" (id, "periodId", category, title, "dueDate", "maxPoints", "createdById") VALUES
        ('h1', 'p1', 'HOMEWORK', 'UV', '2026-10-01', 1, 't1'),
        ('h2', 'p1', 'PRACTICAL', 'Amaliy', '2026-10-02', 20, 't1'),
        ('h3', 'p1', 'EXTRA', 'Loyiha', '2026-10-03', 50, 't1'),
        ('h4', 'p1', 'BONUS', 'Bonus', '2026-10-04', 5, 't1');
      INSERT INTO "HomeworkGrade" (id, "homeworkId", "studentId", points, "gradedAt")
        VALUES ('gr1', 'h3', 's1', 45, now());
    `);
    await client.query(read(migrations[target]));
  });

  afterAll(async () => {
    await client.query(`SET search_path TO public`);
    await client.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await client.query(`DROP SCHEMA IF EXISTS "${BACKUP}" CASCADE`);
    await client.end();
  });

  it("semestr o'z chegaralari va hozirgi qo'shimcha ball qoidasi bilan", async () => {
    const { rows: period } = await client.query(
      `SELECT "templateId", "extraMode", "extraBeyondMax" FROM "Period" WHERE id = 'p1'`,
    );
    expect(period[0]).toEqual({
      templateId: "tpl_t1",
      extraMode: "ANYTIME",
      extraBeyondMax: true,
    });
    const { rows } = await client.query(
      `SELECT kind, cap FROM "SemesterCategory" WHERE "semesterId" = 'p1' ORDER BY "order"`,
    );
    expect(rows).toEqual([
      { kind: "HOMEWORK", cap: 25 },
      { kind: "PRACTICAL", cap: 20 },
      { kind: "ORAL", cap: 10 },
      { kind: "EXTRA", cap: null },
      { kind: "BONUS", cap: null },
    ]);
  });

  it("har topshiriq o'z turidagi kategoriyaga, ball joyida", async () => {
    const { rows } = await client.query(
      `SELECT h.id, sc.kind FROM "Homework" h JOIN "SemesterCategory" sc ON sc.id = h."categoryId" ORDER BY h.id`,
    );
    expect(rows).toEqual([
      { id: "h1", kind: "HOMEWORK" },
      { id: "h2", kind: "PRACTICAL" },
      { id: "h3", kind: "EXTRA" },
      { id: "h4", kind: "BONUS" },
    ]);
    const { rows: grades } = await client.query(
      `SELECT points FROM "HomeworkGrade"`,
    );
    expect(grades).toEqual([{ points: 45 }]);
  });

  it("o'qituvchiga 'Asosiy' shablon — bugungi qoidalar bilan", async () => {
    const { rows } = await client.query(
      `SELECT name, "extraMode", "extraBeyondMax", "isDefault" FROM "GradingTemplate" WHERE "ownerId" = 't1'`,
    );
    expect(rows).toEqual([
      {
        name: "Asosiy",
        extraMode: "ANYTIME",
        extraBeyondMax: true,
        isDefault: true,
      },
    ]);
  });
});
