-- Uyga vazifa bajarilmasa jarima: mavjud vazifalar −1 da qoladi, yangilari −2
ALTER TABLE "Homework" ADD COLUMN "missPenalty" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Homework" ALTER COLUMN "missPenalty" SET DEFAULT 2;
