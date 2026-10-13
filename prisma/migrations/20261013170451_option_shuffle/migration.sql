-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "shuffleOptions" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "shuffleOptions" BOOLEAN NOT NULL DEFAULT false;
