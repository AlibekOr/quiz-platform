-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupMembership_studentId_joinedAt_idx" ON "GroupMembership"("studentId", "joinedAt");

-- CreateIndex
CREATE INDEX "GroupMembership_groupId_joinedAt_idx" ON "GroupMembership"("groupId", "joinedAt");

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mavjud o'quvchilar: hozirgi guruhi bo'yicha ochiq a'zolik (joinedAt = o'quvchi yaratilgan vaqt)
INSERT INTO "GroupMembership" ("id", "studentId", "groupId", "joinedAt", "createdAt")
SELECT gen_random_uuid()::text, u."id", u."groupId", u."createdAt", CURRENT_TIMESTAMP
FROM "User" u
WHERE u."groupId" IS NOT NULL AND u."role" = 'STUDENT';
