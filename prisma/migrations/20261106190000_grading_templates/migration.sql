-- ROLES.md, 4-bosqich: o'qituvchining baholash shablonlari va semestrga nusxa (snapshot).
-- Hech qanday ball o'zgarmaydi: har bir mavjud semestrga O'ZINING hozirgi chegaralari bilan
-- kategoriyalar yoziladi, qo'shimcha ball qoidasi — 2026-11-06 dagi (chegarasiz, istalgan
-- vaqtda, 60 dan oshishi mumkin). Har bir mavjud o'qituvchiga shu qoidalar bilan "Asosiy"
-- shablon yaratiladi. Hammasi bitta tranzaksiyada.

BEGIN;

-- CreateEnum
CREATE TYPE "GradeKind" AS ENUM ('HOMEWORK', 'PRACTICAL', 'ASSIGNMENT', 'ORAL', 'EXTRA', 'BONUS');

-- CreateEnum
CREATE TYPE "ExtraMode" AS ENUM ('ANYTIME', 'AFTER_END_BAND');

-- AlterEnum (yangi qiymat shu tranzaksiyada ishlatilmaydi)
ALTER TYPE "AssignmentCategory" ADD VALUE IF NOT EXISTS 'ASSIGNMENT';

-- CreateTable
CREATE TABLE "GradingTemplate" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxTotal" INTEGER NOT NULL,
    "passPercent" INTEGER NOT NULL,
    "failBelow" INTEGER NOT NULL,
    "extraMode" "ExtraMode" NOT NULL,
    "extraBeyondMax" BOOLEAN NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeCategory" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "GradeKind" NOT NULL,
    "cap" DOUBLE PRECISION,
    "itemMin" DOUBLE PRECISION NOT NULL,
    "itemMax" DOUBLE PRECISION NOT NULL,
    "step" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "GradeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterCategory" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "GradeKind" NOT NULL,
    "cap" DOUBLE PRECISION,
    "itemMin" DOUBLE PRECISION NOT NULL,
    "itemMax" DOUBLE PRECISION NOT NULL,
    "step" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SemesterCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Period" ADD COLUMN "extraBeyondMax" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "extraMode" "ExtraMode" NOT NULL DEFAULT 'AFTER_END_BAND',
ADD COLUMN "templateId" TEXT;

ALTER TABLE "Homework" ADD COLUMN "categoryId" TEXT;

-- Har bir o'qituvchiga "Asosiy" shablon: 60 / 60% / 10, qo'shimcha ball chegarasiz
INSERT INTO "GradingTemplate" ("id", "ownerId", "name", "maxTotal", "passPercent", "failBelow", "extraMode", "extraBeyondMax", "isDefault")
SELECT 'tpl_' || u.id, u.id, 'Asosiy', 60, 60, 10, 'ANYTIME', true, true
FROM "User" u WHERE u.role = 'TEACHER';

INSERT INTO "GradeCategory" ("id", "templateId", "name", "kind", "cap", "itemMin", "itemMax", "step", "order")
SELECT t.id || '_' || c.suffix, t.id, c.name, c.kind::"GradeKind", c.cap, 0, c.item_max, 0.5, c.ord
FROM "GradingTemplate" t
CROSS JOIN (VALUES
  ('homework', 'Uyga vazifa', 'HOMEWORK', 30::float8, 1::float8, 0),
  ('practical', 'Amaliy', 'PRACTICAL', 20::float8, 100::float8, 1),
  ('oral', 'Og''zaki', 'ORAL', 10::float8, 1::float8, 2),
  ('extra', 'Qo''shimcha', 'EXTRA', NULL::float8, 100::float8, 3),
  ('bonus', 'Bonus', 'BONUS', NULL::float8, 100::float8, 4)
) AS c(suffix, name, kind, cap, item_max, ord);

-- Mavjud semestrlar: guruh o'qituvchisining shabloni, hozirgi qo'shimcha ball qoidasi
UPDATE "Period" p
SET "templateId" = 'tpl_' || g."teacherId",
    "extraMode" = 'ANYTIME',
    "extraBeyondMax" = true
FROM "Group" g
WHERE g.id = p."groupId"
  AND EXISTS (SELECT 1 FROM "GradingTemplate" t WHERE t.id = 'tpl_' || g."teacherId");

-- Semestr kategoriyalari — semestrning O'Z chegaralaridan (o'qituvchi o'zgartirgan bo'lsa ham)
INSERT INTO "SemesterCategory" ("id", "semesterId", "name", "kind", "cap", "itemMin", "itemMax", "step", "order")
SELECT p.id || '_homework', p.id, 'Uyga vazifa', 'HOMEWORK'::"GradeKind", p."homeworkCap"::float8, 0, 1, 0.5, 0 FROM "Period" p
UNION ALL
SELECT p.id || '_practical', p.id, 'Amaliy', 'PRACTICAL'::"GradeKind", p."practicalCap"::float8, 0, 100, 0.5, 1 FROM "Period" p
UNION ALL
SELECT p.id || '_oral', p.id, 'Og''zaki', 'ORAL'::"GradeKind", p."oralCap"::float8, 0, 1, 0.5, 2 FROM "Period" p
UNION ALL
SELECT p.id || '_extra', p.id, 'Qo''shimcha', 'EXTRA'::"GradeKind", NULL::float8, 0, 100, 0.5, 3 FROM "Period" p
UNION ALL
SELECT p.id || '_bonus', p.id, 'Bonus', 'BONUS'::"GradeKind", NULL::float8, 0, 100, 0.5, 4 FROM "Period" p;

-- Topshiriq — o'z turidagi semestr kategoriyasiga
UPDATE "Homework" h SET "categoryId" = h."periodId" || '_' || lower(h."category"::text);
ALTER TABLE "Homework" ALTER COLUMN "categoryId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GradingTemplate_ownerId_name_key" ON "GradingTemplate"("ownerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "GradeCategory_templateId_name_key" ON "GradeCategory"("templateId", "name");

-- CreateIndex
CREATE INDEX "SemesterCategory_semesterId_order_idx" ON "SemesterCategory"("semesterId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterCategory_semesterId_name_key" ON "SemesterCategory"("semesterId", "name");

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GradingTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingTemplate" ADD CONSTRAINT "GradingTemplate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeCategory" ADD CONSTRAINT "GradeCategory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GradingTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterCategory" ADD CONSTRAINT "SemesterCategory_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- NO ACTION (RESTRICT emas): semestr o'chganda topshiriq va kategoriya birga cascade bo'ladi
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SemesterCategory"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT;
