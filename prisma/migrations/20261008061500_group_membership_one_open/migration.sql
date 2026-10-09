-- Bir o'quvchida bir vaqtda faqat bitta ochiq a'zolik (hozirgi guruh) bo'lishi mumkin.
-- Prisma sxemasida qisman indeks ifodalanmaydi, shuning uchun faqat SQL'da
CREATE UNIQUE INDEX "GroupMembership_one_open_per_student"
ON "GroupMembership" ("studentId")
WHERE "leftAt" IS NULL;
