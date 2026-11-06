-- ROLES.md, 1-bosqich: ADMIN roli, ko'p o'qituvchi, o'qituvchi regionlari va menejerlari,
-- guruh kodi, egasi bo'yicha jarima shablonlari va testlar, test ulashish.
-- Hech qanday ma'lumot o'chirilmaydi: hozirgi yagona o'qituvchi TEACHER bo'lib qoladi va
-- mavjud guruhlar, regionlar, menejerlar, jarima shablonlari va testlar unga biriktiriladi.
-- Menejerlarning hozirgi doirasi (region guruhlari) ManagerGroup ga yoziladi.
-- Hammasi bitta tranzaksiyada: biror qadam xato bersa, baza o'zgarmasdan qoladi.

BEGIN;

-- Bazada ko'pi bilan bitta o'qituvchi. Guruh yoki menejer bor-u, o'qituvchi yo'q bo'lsa — to'xtash
DO $$
DECLARE
  teachers integer;
BEGIN
  SELECT count(*) INTO teachers FROM "User" WHERE role = 'TEACHER';
  IF teachers > 1 THEN
    RAISE EXCEPTION 'roles: bazada % ta TEACHER bor, kutilgani bitta', teachers;
  END IF;
  IF teachers = 0 AND (
    EXISTS (SELECT 1 FROM "Group")
    OR EXISTS (SELECT 1 FROM "User" WHERE role = 'MANAGER')
    OR EXISTS (SELECT 1 FROM "Penalty")
  ) THEN
    RAISE EXCEPTION 'roles: guruh yoki menejer bor, lekin TEACHER yo''q';
  END IF;
END $$;

-- AlterEnum (yangi qiymat shu tranzaksiyada ishlatilmaydi)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN';

-- Vaqtinchalik yordamchilar (oxirida o'chiriladi): lib/group-code.ts dagi qoidalar
CREATE FUNCTION "roles_word"(value text, n integer) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
  SELECT split_part(regexp_replace(btrim(coalesce(value, '')), '\s+', ' ', 'g'), ' ', n)
$$;

-- So'zning birinchi harfi: Sh va Ch — bitta harf, apostroflar tashlanadi
CREATE FUNCTION "roles_initial"(word text) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN left(w, 2) IN ('SH', 'CH') THEN left(w, 2) ELSE left(w, 1) END
  FROM (
    SELECT upper(regexp_replace(
      regexp_replace(coalesce(word, ''), '[''ʻʼ‘’`]', '', 'g'),
      '^[^[:alnum:]]+', ''
    )) AS w
  ) s
$$;

-- DropIndex: guruh nomlari va jarima shablonlari nomlari endi takrorlanishi mumkin
DROP INDEX "Group_name_key";
DROP INDEX "PenaltyType_name_key";

-- Group: o'qituvchi, butun loyiha bo'yicha raqam (yaratilgan tartibda), kod
ALTER TABLE "Group" ADD COLUMN "code" TEXT,
ADD COLUMN "seq" INTEGER,
ADD COLUMN "teacherId" TEXT;

UPDATE "Group" SET "teacherId" = (SELECT id FROM "User" WHERE role = 'TEACHER' LIMIT 1);

CREATE SEQUENCE "Group_seq_seq" AS INTEGER OWNED BY "Group"."seq";

UPDATE "Group" g SET "seq" = o.n
FROM (SELECT id, row_number() OVER (ORDER BY "createdAt", id) AS n FROM "Group") o
WHERE g.id = o.id;

SELECT setval('"Group_seq_seq"', coalesce((SELECT max("seq") FROM "Group"), 0) + 1, false);

ALTER TABLE "Group" ALTER COLUMN "seq" SET DEFAULT nextval('"Group_seq_seq"'),
ALTER COLUMN "seq" SET NOT NULL,
ALTER COLUMN "teacherId" SET NOT NULL;

-- Kod: REGION + O'QITUVCHI + "-" + seq + "-" + NOM (regionsiz guruhda region harfisiz)
UPDATE "Group" g SET "code" =
  coalesce((SELECT "roles_initial"("roles_word"(r.name, 1)) FROM "Region" r WHERE r.id = g."regionId"), '')
  || (SELECT "roles_initial"("roles_word"(t."fullName", 1)) || "roles_initial"("roles_word"(t."fullName", 2))
      FROM "User" t WHERE t.id = g."teacherId")
  || '-' || g."seq" || '-' || "roles_initial"("roles_word"(g.name, 1));

-- ManagerGroup: kim biriktirgani (mavjudlari — hozirgi o'qituvchi)
ALTER TABLE "ManagerGroup" ADD COLUMN "assignedById" TEXT;
UPDATE "ManagerGroup" SET "assignedById" = (SELECT id FROM "User" WHERE role = 'TEACHER' LIMIT 1);
ALTER TABLE "ManagerGroup" ALTER COLUMN "assignedById" SET NOT NULL;

-- PenaltyType: egasi. O'qituvchisiz yangi bazada (faqat namunaviy shablonlar) — ular o'chadi,
-- o'qituvchi yaratilganda unga nusxalanadi
ALTER TABLE "PenaltyType" ADD COLUMN "ownerId" TEXT;
UPDATE "PenaltyType" SET "ownerId" = (SELECT id FROM "User" WHERE role = 'TEACHER' LIMIT 1);
DELETE FROM "PenaltyType" WHERE "ownerId" IS NULL;
ALTER TABLE "PenaltyType" ALTER COLUMN "ownerId" SET NOT NULL;

-- Test: egasi (o'qituvchi yaratganlari — o'shaniki; menejer yaratganlari — null) va nusxa manbai
ALTER TABLE "Test" ADD COLUMN "copiedFromId" TEXT,
ADD COLUMN "ownerId" TEXT;
UPDATE "Test" t SET "ownerId" = t."createdById"
FROM "User" u WHERE u.id = t."createdById" AND u.role = 'TEACHER';

-- CreateTable
CREATE TABLE "TeacherRegion" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherManager" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestShare" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "regionId" TEXT,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestShare_pkey" PRIMARY KEY ("id"),
    -- Aynan bittasi: regionga yoki o'qituvchiga
    CONSTRAINT "TestShare_target_check" CHECK (("regionId" IS NULL) <> ("teacherId" IS NULL))
);

-- Hozirgi o'qituvchi: barcha regionlar (ularni u yaratgan), barcha menejerlar
INSERT INTO "TeacherRegion" ("id", "teacherId", "regionId")
SELECT gen_random_uuid()::text, t.id, r.id
FROM "User" t CROSS JOIN "Region" r
WHERE t.role = 'TEACHER';

INSERT INTO "TeacherManager" ("id", "teacherId", "managerId")
SELECT gen_random_uuid()::text, t.id, m.id
FROM "User" t CROSS JOIN "User" m
WHERE t.role = 'TEACHER' AND m.role = 'MANAGER';

-- Menejer doirasi saqlanadi: hozir region orqali ko'rayotgan guruhlari biriktiriladi
INSERT INTO "ManagerGroup" ("id", "managerId", "groupId", "assignedById")
SELECT gen_random_uuid()::text, m.id, g.id, g."teacherId"
FROM "User" m JOIN "Group" g ON g."regionId" = m."regionId"
WHERE m.role = 'MANAGER'
ON CONFLICT ("managerId", "groupId") DO NOTHING;

DROP FUNCTION "roles_initial"(text);
DROP FUNCTION "roles_word"(text, integer);

-- CreateIndex
CREATE INDEX "TeacherRegion_regionId_idx" ON "TeacherRegion"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherRegion_teacherId_regionId_key" ON "TeacherRegion"("teacherId", "regionId");

-- CreateIndex
CREATE INDEX "TeacherManager_managerId_idx" ON "TeacherManager"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherManager_teacherId_managerId_key" ON "TeacherManager"("teacherId", "managerId");

-- CreateIndex
CREATE INDEX "TestShare_teacherId_idx" ON "TestShare"("teacherId");

-- CreateIndex
CREATE INDEX "TestShare_regionId_idx" ON "TestShare"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "TestShare_testId_regionId_key" ON "TestShare"("testId", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "TestShare_testId_teacherId_key" ON "TestShare"("testId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_seq_key" ON "Group"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");

-- CreateIndex
CREATE INDEX "Group_teacherId_idx" ON "Group"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "PenaltyType_ownerId_name_key" ON "PenaltyType"("ownerId", "name");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_copiedFromId_fkey" FOREIGN KEY ("copiedFromId") REFERENCES "Test"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenaltyType" ADD CONSTRAINT "PenaltyType_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerGroup" ADD CONSTRAINT "ManagerGroup_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherRegion" ADD CONSTRAINT "TeacherRegion_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherRegion" ADD CONSTRAINT "TeacherRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherManager" ADD CONSTRAINT "TeacherManager_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherManager" ADD CONSTRAINT "TeacherManager_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestShare" ADD CONSTRAINT "TestShare_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestShare" ADD CONSTRAINT "TestShare_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestShare" ADD CONSTRAINT "TestShare_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
