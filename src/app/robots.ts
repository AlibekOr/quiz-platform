import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Qidiruv tizimlari faqat login sahifani ko'radi: qolgan hamma sahifa login talab qiladi
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/login"],
      disallow: "/",
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.origin,
  };
}
