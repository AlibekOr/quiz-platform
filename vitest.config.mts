import "dotenv/config";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = (path: string) =>
  fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": src(""),
      "server-only": src("test/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          exclude: ["src/**/*.db.test.ts"],
        },
      },
      {
        // Haqiqiy Postgres'da (TEST_DATABASE_URL) — reyting SQL so'rovlari uchun
        extends: true,
        test: {
          name: "db",
          include: ["src/**/*.db.test.ts"],
          globalSetup: ["src/test/db-global-setup.ts"],
          env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
          fileParallelism: false,
        },
      },
    ],
  },
});
