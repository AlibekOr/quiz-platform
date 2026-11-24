-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "closedForLeaving" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tabLeaves" INTEGER NOT NULL DEFAULT 0;
