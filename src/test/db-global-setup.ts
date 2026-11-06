import { execSync } from "node:child_process";
import pg from "pg";

/**
 * Oldingi ishga tushirishdan qolgan qatorlar (har test oldidan baribir tozalanadi).
 * Ma'lumot ko'chiruvchi migratsiyalar (masalan, roles) yarim-yaroq test ma'lumotiga qoqilmasin
 */
async function truncateLeftovers(url: string) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
    );
    if (rows.length > 0)
      await client.query(
        `TRUNCATE ${rows.map((t) => `"public"."${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`,
      );
  } finally {
    await client.end();
  }
}

/** db testlaridan oldin bir marta: test bazasiga migratsiyalarni qo'llaydi */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url)
    throw new Error(
      "TEST_DATABASE_URL .env da berilmagan (reyting SQL testlari uchun alohida baza)",
    );
  if (url === process.env.DATABASE_URL)
    throw new Error("TEST_DATABASE_URL asosiy baza bilan bir xil bo'lmasin");
  await truncateLeftovers(url);
  execSync("pnpm exec prisma migrate deploy", {
    // DIRECT_URL ham test bazasiga: aks holda prisma.config.ts migratsiyani boshqa bazaga yuboradi
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    stdio: "pipe",
  });
}
