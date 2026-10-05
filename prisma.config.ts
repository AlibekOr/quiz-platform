import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Vercel'da migratsiya Neon pooler (PgBouncer) orqali emas, to'g'ridan-to'g'ri ulanish bilan bo'lsin
if (process.env.VERCEL && !process.env.DIRECT_URL) {
  throw new Error(
    "DIRECT_URL berilmagan: Neon'ning pooler'siz ulanish satrini Vercel env'ga qo'shing",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // CLI (migrate) uchun: Neon'da pooler'siz to'g'ridan-to'g'ri ulanish (DIRECT_URL).
    // Ilova o'zi doim DATABASE_URL (pooled) bilan ishlaydi — src/lib/db.ts
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
