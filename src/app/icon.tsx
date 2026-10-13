import { ImageResponse } from "next/og";
import { AppIcon } from "@/components/app-icon";

// /icon/192 va /icon/512 — manifest (telefonga o'rnatish) va brauzer uchun
const SIZES = [192, 512] as const;

export function generateImageMetadata() {
  return SIZES.map((s) => ({
    id: String(s),
    size: { width: s, height: s },
    contentType: "image/png",
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id) || 512;
  return new ImageResponse(<AppIcon size={size} />, {
    width: size,
    height: size,
  });
}
