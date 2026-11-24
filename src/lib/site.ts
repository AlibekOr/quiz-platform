// Sayt haqida umumiy ma'lumot: SEO (metadata, robots, sitemap) va PWA manifest uchun

export const SITE_NAME = "Al-Xorazmiy vorislari";

export const SITE_TITLE = `${SITE_NAME} — onlayn test platformasi`;

export const SITE_DESCRIPTION =
  "Al-Xorazmiy vorislari o'quv markazi o'quvchilari uchun onlayn test platformasi: testlar, reyting, baholar, uyga vazifa va davomat.";

export const SITE_KEYWORDS = [
  "Al-Xorazmiy vorislari",
  "Al-Xorazmiy vorislari o'quv markazi",
  "Xorazmiy vorislari",
  "al-xorazimiy vorislari",
  "o'quv markaz",
  "onlayn test",
  "test platformasi",
];

/**
 * Saytning asosiy manzili. Vercel production domenini o'zi beradi
 * (VERCEL_PROJECT_PRODUCTION_URL, protokolsiz); lokalda — localhost
 */
export function siteUrl(): URL {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(host ? `https://${host}` : "http://localhost:3000");
}
