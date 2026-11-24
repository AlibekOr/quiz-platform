import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

// Telefonda ilova sifatida o'rnatish (PWA). Offline rejim yo'q: test serverda tekshiriladi
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Testlar",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    lang: "uz",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
