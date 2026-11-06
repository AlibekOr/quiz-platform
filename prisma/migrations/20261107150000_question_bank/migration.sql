-- Savollar banki (FEATURES.md, B qism): mavzular, bank savollari va variantlari.
-- Test savollari nusxa sifatida qoladi; Question.sourceBankQuestionId — faqat manba havolasi.
BEGIN;

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "sourceBankQuestionId" TEXT;

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankQuestion" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'SINGLE',
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "points" INTEGER NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "tags" TEXT[],
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankOption" (
    "id" TEXT NOT NULL,
    "bankQuestionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "BankOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Topic_ownerId_idx" ON "Topic"("ownerId");

-- CreateIndex
CREATE INDEX "BankQuestion_ownerId_topicId_idx" ON "BankQuestion"("ownerId", "topicId");

-- CreateIndex
CREATE INDEX "Question_sourceBankQuestionId_idx" ON "Question"("sourceBankQuestionId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sourceBankQuestionId_fkey" FOREIGN KEY ("sourceBankQuestionId") REFERENCES "BankQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Topic"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankQuestion" ADD CONSTRAINT "BankQuestion_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankOption" ADD CONSTRAINT "BankOption_bankQuestionId_fkey" FOREIGN KEY ("bankQuestionId") REFERENCES "BankQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
