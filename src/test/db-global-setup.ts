import { execSync } from "node:child_process";

/** db testlaridan oldin bir marta: test bazasiga migratsiyalarni qo'llaydi */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url)
    throw new Error(
      "TEST_DATABASE_URL .env da berilmagan (reyting SQL testlari uchun alohida baza)",
    );
  if (url === process.env.DATABASE_URL)
    throw new Error("TEST_DATABASE_URL asosiy baza bilan bir xil bo'lmasin");
  execSync("pnpm exec prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });
}
