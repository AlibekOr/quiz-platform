-- AlterTable
ALTER TABLE "Test" ALTER COLUMN "allowRetake" SET DEFAULT true;

-- Tayyorlov testlari: o'quvchi xohlagancha qayta ishlaydi (mavjud testlar ham)
UPDATE "Test" SET "allowRetake" = true;
