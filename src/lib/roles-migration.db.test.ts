import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// roles migratsiyasi (ROLES.md, 1-bosqich) prod'dagi ma'lumotni yo'qotmasligi.
// Test bazasida alohida sxemalarda: oldingi migratsiyalar -> prod'ga o'xshash ma'lumot ->
// roles migratsiyasi -> tekshiruv. "backup" sxemasi almashtiriladi (haqiqiy zaxiraga tegilmaydi)

const BACKUP = "mig_roles_backup";
const TARGET = "roles";
const dir = join(process.cwd(), "prisma", "migrations");
const migrations = readdirSync(dir)
  .filter((d) => /^\d+_/.test(d))
  .sort();
const targetIndex = migrations.findIndex((m) => m.endsWith(`_${TARGET}`));
const read = (m: string) =>
  readFileSync(join(dir, m, "migration.sql"), "utf8").replaceAll(
    '"backup"',
    `"${BACKUP}"`,
  );

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function run(sql: string) {
  await client.query(sql);
}

async function rows<T>(sql: string): Promise<T[]> {
  return (await client.query(sql)).rows as T[];
}

/** Toza sxemada roles'gacha bo'lgan migratsiyalar */
async function prepare(schema: string) {
  await run(`DROP SCHEMA IF EXISTS "${BACKUP}" CASCADE`);
  await run(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await run(`CREATE SCHEMA "${schema}"`);
  await run(`SET search_path TO "${schema}"`);
  expect(targetIndex).toBeGreaterThan(0);
  for (const m of migrations.slice(0, targetIndex)) await run(read(m));
}

// Prod'ga o'xshash: bitta o'qituvchi, 3 region (biri guruhsiz), 3 guruh (biri regionsiz),
// 3 menejer (biri qo'shimcha guruh bilan, biri regionsiz), jarima, o'qituvchi va menejer testlari
const PROD_LIKE = `
  INSERT INTO "User" (id, username, "fullName", "passwordHash", role)
    VALUES ('t1', 'alibek', 'Orakbaev Alibek', 'x', 'TEACHER');
  INSERT INTO "Region" (id, name) VALUES
    ('r1', 'Shomanay'), ('r2', 'Xojeli'), ('r3', 'Nukus');
  INSERT INTO "Group" (id, name, "regionId", "createdAt") VALUES
    ('g2', 'Xojeli 246 14:00', 'r2', '2026-09-02'),
    ('g1', 'Shomanay 135 16:00', 'r1', '2026-09-01'),
    ('g3', 'Erkin guruh', NULL, '2026-09-03');
  INSERT INTO "User" (id, username, "fullName", "passwordHash", role, "regionId", "groupId") VALUES
    ('m1', 'menejer1', 'Menejer 1', 'x', 'MANAGER', 'r1', NULL),
    ('m2', 'menejer2', 'Menejer 2', 'x', 'MANAGER', 'r2', NULL),
    ('m3', 'menejer3', 'Menejer 3', 'x', 'MANAGER', NULL, NULL),
    ('s1', 'ali', 'Ali', 'x', 'STUDENT', NULL, 'g1'),
    ('s2', 'vali', 'Vali', 'x', 'STUDENT', NULL, 'g3');
  INSERT INTO "ManagerGroup" (id, "managerId", "groupId") VALUES ('mg1', 'm2', 'g1');
  INSERT INTO "PenaltyType" (id, name, "defaultPoints") VALUES ('pt-custom', 'Telefon', 1);
  INSERT INTO "Period" (id, "groupId", name, "startDate", "endDate")
    VALUES ('sem1', 'g1', '1-semestr', '2026-09-01', '2026-12-31');
  INSERT INTO "Penalty" (id, "studentId", "semesterId", "typeId", points, date, "createdById")
    VALUES ('pen1', 's1', 'sem1', 'penalty_late', 1, '2026-10-01', 't1');
  INSERT INTO "Test" (id, title, "durationMin", "createdById") VALUES
    ('test-t', 'O''qituvchi testi', 10, 't1'),
    ('test-m', 'Menejer testi', 10, 'm1');
`;

beforeAll(async () => {
  if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL)
    throw new Error("Migratsiya testi faqat test bazasida ishlaydi");
  await client.connect();
  await prepare("mig_roles");
  await run(PROD_LIKE);
  await run(read(migrations[targetIndex]));
});

afterAll(async () => {
  await run(`SET search_path TO public`);
  await run(`DROP SCHEMA IF EXISTS "mig_roles" CASCADE`);
  await run(`DROP SCHEMA IF EXISTS "mig_roles_fail" CASCADE`);
  await run(`DROP SCHEMA IF EXISTS "${BACKUP}" CASCADE`);
  await client.end();
});

describe("roles migratsiyasi", () => {
  it("guruhlar o'qituvchiga, raqam yaratilgan tartibda, kod (regionsiz — harfisiz)", async () => {
    await run(`SET search_path TO "mig_roles"`);
    expect(
      await rows(`SELECT id, "teacherId", seq, code FROM "Group" ORDER BY seq`),
    ).toEqual([
      { id: "g1", teacherId: "t1", seq: 1, code: "SHOA-1-SH" },
      { id: "g2", teacherId: "t1", seq: 2, code: "XOA-2-X" },
      { id: "g3", teacherId: "t1", seq: 3, code: "OA-3-E" },
    ]);
  });

  it("yangi guruh keyingi raqamni oladi, nom takrorlanishi mumkin", async () => {
    await run(`SET search_path TO "mig_roles"`);
    await run(
      `INSERT INTO "Group" (id, name, "teacherId") VALUES ('g4', 'Erkin guruh', 't1')`,
    );
    const [g] = await rows<{ seq: number }>(
      `SELECT seq FROM "Group" WHERE id = 'g4'`,
    );
    expect(g.seq).toBe(4);
  });

  it("o'qituvchiga barcha regionlar va menejerlar", async () => {
    await run(`SET search_path TO "mig_roles"`);
    expect(
      await rows(
        `SELECT "regionId" FROM "TeacherRegion" WHERE "teacherId" = 't1' ORDER BY "regionId"`,
      ),
    ).toEqual([{ regionId: "r1" }, { regionId: "r2" }, { regionId: "r3" }]);
    expect(
      await rows(
        `SELECT "managerId" FROM "TeacherManager" WHERE "teacherId" = 't1' ORDER BY "managerId"`,
      ),
    ).toEqual([{ managerId: "m1" }, { managerId: "m2" }, { managerId: "m3" }]);
  });

  it("menejer doirasi saqlanadi: region guruhlari + qo'shimchasi, kim biriktirgani bilan", async () => {
    await run(`SET search_path TO "mig_roles"`);
    expect(
      await rows(
        `SELECT "managerId", "groupId", "assignedById" FROM "ManagerGroup" ORDER BY "managerId", "groupId"`,
      ),
    ).toEqual([
      { managerId: "m1", groupId: "g1", assignedById: "t1" },
      { managerId: "m2", groupId: "g1", assignedById: "t1" },
      { managerId: "m2", groupId: "g2", assignedById: "t1" },
    ]);
  });

  it("jarima shablonlari o'qituvchiga, jarimalar joyida", async () => {
    await run(`SET search_path TO "mig_roles"`);
    const types = await rows<{ id: string; ownerId: string }>(
      `SELECT id, "ownerId" FROM "PenaltyType" ORDER BY id`,
    );
    expect(types).toHaveLength(5);
    expect(types.every((t) => t.ownerId === "t1")).toBe(true);
    expect(await rows(`SELECT id, "typeId", points FROM "Penalty"`)).toEqual([
      { id: "pen1", typeId: "penalty_late", points: 1 },
    ]);
  });

  it("testlar: o'qituvchiniki — unga, menejerniki — egasiz", async () => {
    await run(`SET search_path TO "mig_roles"`);
    expect(await rows(`SELECT id, "ownerId" FROM "Test" ORDER BY id`)).toEqual([
      { id: "test-m", ownerId: null },
      { id: "test-t", ownerId: "t1" },
    ]);
  });

  it("o'quvchilar va semestr joyida, ADMIN roli qo'shilgan", async () => {
    await run(`SET search_path TO "mig_roles"`);
    expect(
      await rows(
        `SELECT id, "groupId" FROM "User" WHERE role = 'STUDENT' ORDER BY id`,
      ),
    ).toEqual([
      { id: "s1", groupId: "g1" },
      { id: "s2", groupId: "g3" },
    ]);
    expect(await rows(`SELECT id FROM "Period"`)).toEqual([{ id: "sem1" }]);
    await run(
      `INSERT INTO "User" (id, username, "fullName", "passwordHash", role) VALUES ('a1', 'admin', 'Admin', 'x', 'ADMIN')`,
    );
  });

  it("test ulashish: aynan bittasi (region yoki o'qituvchi)", async () => {
    await run(`SET search_path TO "mig_roles"`);
    await run(
      `INSERT INTO "TestShare" (id, "testId", "regionId") VALUES ('sh1', 'test-t', 'r1')`,
    );
    await expect(
      run(
        `INSERT INTO "TestShare" (id, "testId", "regionId", "teacherId") VALUES ('sh2', 'test-t', 'r2', 't1')`,
      ),
    ).rejects.toThrow(/TestShare_target_check/);
    await expect(
      run(`INSERT INTO "TestShare" (id, "testId") VALUES ('sh3', 'test-t')`),
    ).rejects.toThrow(/TestShare_target_check/);
  });

  it("ikkita o'qituvchi bo'lsa — to'xtaydi va hech narsa o'zgarmaydi", async () => {
    await prepare("mig_roles_fail");
    await run(PROD_LIKE);
    await run(
      `INSERT INTO "User" (id, username, "fullName", "passwordHash", role) VALUES ('t2', 'ikkinchi', 'Ikkinchi', 'x', 'TEACHER')`,
    );
    await expect(run(read(migrations[targetIndex]))).rejects.toThrow(
      /2 ta TEACHER/,
    );
    await run(`ROLLBACK`);
    const columns = await rows<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'mig_roles_fail' AND table_name = 'Group' AND column_name = 'teacherId'`,
    );
    expect(columns).toEqual([]);
    const enumValues = await rows<{ v: string }>(
      `SELECT unnest(enum_range(NULL::"Role"))::text AS v`,
    );
    expect(enumValues.map((e) => e.v)).not.toContain("ADMIN");
  });
});
