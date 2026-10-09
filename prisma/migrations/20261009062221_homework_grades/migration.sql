-- CreateEnum
CREATE TYPE "GradeItemType" AS ENUM ('HOMEWORK', 'TEST');

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "dueDate" DATE;

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "passPercent" INTEGER NOT NULL DEFAULT 60,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homework" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATE NOT NULL,
    "maxPoints" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeworkGrade" (
    "id" TEXT NOT NULL,
    "homeworkId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "note" TEXT,
    "gradedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeworkGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPeriod" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "TestPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeExemption" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "itemType" "GradeItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeExemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointAdjustment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Period_groupId_startDate_idx" ON "Period"("groupId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Period_groupId_name_key" ON "Period"("groupId", "name");

-- CreateIndex
CREATE INDEX "Homework_periodId_dueDate_idx" ON "Homework"("periodId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "HomeworkGrade_homeworkId_studentId_key" ON "HomeworkGrade"("homeworkId", "studentId");

-- CreateIndex
CREATE INDEX "TestPeriod_periodId_idx" ON "TestPeriod"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "TestPeriod_testId_periodId_key" ON "TestPeriod"("testId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "GradeExemption_studentId_itemType_itemId_key" ON "GradeExemption"("studentId", "itemType", "itemId");

-- CreateIndex
CREATE INDEX "PointAdjustment_studentId_periodId_idx" ON "PointAdjustment"("studentId", "periodId");

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkGrade" ADD CONSTRAINT "HomeworkGrade_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeworkGrade" ADD CONSTRAINT "HomeworkGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPeriod" ADD CONSTRAINT "TestPeriod_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPeriod" ADD CONSTRAINT "TestPeriod_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeExemption" ADD CONSTRAINT "GradeExemption_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointAdjustment" ADD CONSTRAINT "PointAdjustment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointAdjustment" ADD CONSTRAINT "PointAdjustment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
