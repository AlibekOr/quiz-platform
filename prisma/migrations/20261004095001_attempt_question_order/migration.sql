-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "questionOrder" TEXT[] DEFAULT ARRAY[]::TEXT[];
