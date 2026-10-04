import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Excel/JSON import fayllari server action orqali keladi (fayl o'zi 2MB bilan cheklanadi)
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
