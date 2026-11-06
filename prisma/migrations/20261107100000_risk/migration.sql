-- FEATURES.md, A qism: xavf ostidagi o'quvchilar — o'qituvchi sozlamalari va "Ko'rib chiqildi".
-- Faqat yangi jadvallar; mavjud ma'lumotga tegilmaydi.

BEGIN;

-- CreateTable
CREATE TABLE "RiskSettings" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "absencesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "absencesMin" INTEGER NOT NULL DEFAULT 2,
    "attendanceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "attendanceBelow" INTEGER NOT NULL DEFAULT 70,
    "attendanceMinLessons" INTEGER NOT NULL DEFAULT 4,
    "missedEnabled" BOOLEAN NOT NULL DEFAULT true,
    "missedLastN" INTEGER NOT NULL DEFAULT 3,
    "missedMin" INTEGER NOT NULL DEFAULT 2,
    "paceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "paceRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "paceGraceDays" INTEGER NOT NULL DEFAULT 14,
    "paceHighAfter" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "penaltiesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "penaltiesWindowDays" INTEGER NOT NULL DEFAULT 30,
    "penaltiesMin" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskReview" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reviewedById" TEXT NOT NULL,
    "note" TEXT,
    "signalKinds" TEXT[],
    "hideUntil" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiskSettings_teacherId_key" ON "RiskSettings"("teacherId");

-- CreateIndex
CREATE INDEX "RiskReview_studentId_createdAt_idx" ON "RiskReview"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "RiskSettings" ADD CONSTRAINT "RiskSettings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskReview" ADD CONSTRAINT "RiskReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
