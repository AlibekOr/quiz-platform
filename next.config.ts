import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev'da server action argumentlari (login paroli ham) terminalga yozilmasin (CLAUDE.md, 6-qoida)
  logging: { serverFunctions: false },
  experimental: {
    serverActions: {
      // Excel/JSON import fayllari server action orqali keladi (fayl o'zi 2MB bilan cheklanadi)
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
