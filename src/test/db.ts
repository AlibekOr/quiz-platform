import { db } from "@/lib/db";

/** Har bir testdan oldin test bazasini tozalash (faqat TEST_DATABASE_URL — vitest.config.mts) */
export async function resetDatabase() {
  if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
    throw new Error("resetDatabase faqat test bazasida ishlaydi");
  }
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}
