-- AlterEnum
ALTER TYPE "AttendanceStatus" ADD VALUE 'EXCUSED';

-- Sababsiz kelmaslik endi avtomatik −1 (lib/grades.ts autoPenalties): eski −2 shablon
-- yangi jarimalar uchun o'chiriladi, eski jarimalar saqlanadi
UPDATE "PenaltyType" SET "isActive" = false WHERE "id" = 'penalty_absent';
