/*
  Warnings:

  - You are about to drop the column `dueDate` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the `GradeExemption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TestPeriod` table. If the table is not empty, all the data it contains will be lost.

*/
-- Olib tashlanadigan va o'zgaradigan ma'lumotlarning zaxirasi. "backup" sxemasini Prisma
-- boshqarmaydi (datasource faqat "public"), shuning uchun keyingi migratsiyalar unga tegmaydi.
-- Hech narsa yo'qolmaydi: kerak bo'lsa shu jadvallardan tiklanadi
CREATE SCHEMA IF NOT EXISTS "backup";
-- itemType matnga o'giriladi: zaxira o'chiriladigan GradeItemType enum'iga bog'lanmasin
CREATE TABLE "backup"."GradeExemption_20261011" AS
  SELECT "id", "studentId", "itemType"::text AS "itemType", "itemId", "reason",
         "createdById", "createdAt"
  FROM "GradeExemption";
CREATE TABLE "backup"."TestPeriod_20261011" AS TABLE "TestPeriod";
CREATE TABLE "backup"."TestDueDate_20261011" AS
  SELECT "id", "dueDate" FROM "Test" WHERE "dueDate" IS NOT NULL;
CREATE TABLE "backup"."Homework_20261011" AS TABLE "Homework";
CREATE TABLE "backup"."HomeworkGrade_20261011" AS TABLE "HomeworkGrade";

-- CreateEnum
CREATE TYPE "AssignmentCategory" AS ENUM ('HOMEWORK', 'PRACTICAL', 'EXTRA', 'BONUS');

-- DropForeignKey
ALTER TABLE "GradeExemption" DROP CONSTRAINT "GradeExemption_studentId_fkey";

-- DropForeignKey
ALTER TABLE "TestPeriod" DROP CONSTRAINT "TestPeriod_periodId_fkey";

-- DropForeignKey
ALTER TABLE "TestPeriod" DROP CONSTRAINT "TestPeriod_testId_fkey";

-- AlterTable
ALTER TABLE "Homework" ADD COLUMN     "category" "AssignmentCategory" NOT NULL DEFAULT 'HOMEWORK';

-- AlterTable
ALTER TABLE "HomeworkGrade" ALTER COLUMN "points" SET DATA TYPE DOUBLE PRECISION;

-- Uyga vazifa endi 0 / 0.5 / 1 (maxPoints = 1). Mavjud ball maxPoints'ga nisbatan 0.5 gacha
-- yaxlitlanadi (asl qiymatlar backup."HomeworkGrade_20261011" da)
UPDATE "HomeworkGrade" AS g
SET "points" = ROUND((LEAST(g."points", h."maxPoints") / h."maxPoints") * 2) / 2.0
FROM "Homework" AS h
WHERE g."homeworkId" = h."id" AND h."maxPoints" <> 1;
UPDATE "Homework" SET "maxPoints" = 1 WHERE "maxPoints" <> 1;

-- AlterTable
ALTER TABLE "Period" ADD COLUMN     "closed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "extraCap" INTEGER NOT NULL DEFAULT 40,
ADD COLUMN     "failBelow" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "homeworkCap" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "maxTotal" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "oralCap" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "practicalCap" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "PointAdjustment" ALTER COLUMN "points" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "dueDate";

-- DropTable
DROP TABLE "GradeExemption";

-- DropTable
DROP TABLE "TestPeriod";

-- DropEnum
DROP TYPE "GradeItemType";

-- CreateTable
CREATE TABLE "OralScore" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OralScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OralScore_studentId_idx" ON "OralScore"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "OralScore_lessonId_studentId_key" ON "OralScore"("lessonId", "studentId");

-- AddForeignKey
ALTER TABLE "OralScore" ADD CONSTRAINT "OralScore_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OralScore" ADD CONSTRAINT "OralScore_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
