-- CreateTable
CREATE TABLE "TestShareDismissal" (
    "testId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestShareDismissal_pkey" PRIMARY KEY ("testId","teacherId")
);

-- CreateIndex
CREATE INDEX "TestShareDismissal_teacherId_idx" ON "TestShareDismissal"("teacherId");

-- AddForeignKey
ALTER TABLE "TestShareDismissal" ADD CONSTRAINT "TestShareDismissal_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestShareDismissal" ADD CONSTRAINT "TestShareDismissal_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
