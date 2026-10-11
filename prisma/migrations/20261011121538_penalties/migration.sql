-- CreateTable
CREATE TABLE "PenaltyType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultPoints" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenaltyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalty" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "date" DATE NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PenaltyType_name_key" ON "PenaltyType"("name");

-- CreateIndex
CREATE INDEX "Penalty_semesterId_studentId_idx" ON "Penalty"("semesterId", "studentId");

-- CreateIndex
CREATE INDEX "Penalty_studentId_idx" ON "Penalty"("studentId");

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "PenaltyType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Namunaviy jarima shablonlari (prod'da seed ishlamaydi). O'qituvchi keyin o'zgartiradi
INSERT INTO "PenaltyType" ("id", "name", "defaultPoints", "description") VALUES
  ('penalty_absent', 'Darsga sababsiz kelmaslik', 2, NULL),
  ('penalty_copying', 'Uyga vazifani ko''chirish', 2, NULL),
  ('penalty_discipline', 'Darsda tartibni buzish', 1, NULL),
  ('penalty_late', 'Darsga kechikish', 1, NULL)
ON CONFLICT ("name") DO NOTHING;
