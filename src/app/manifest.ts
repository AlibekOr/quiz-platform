import type { MetadataRoute } from "next";

// Telefonda ilova sifatida o'rnatish (PWA). Offline rejim yo'q: test serverda tekshiriladi
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Test platformasi",
    short_name: "Testlar",
    description: "O'qituvchi va o'quvchilar uchun test platformasi",
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
