import { ImageResponse } from "next/og";
import { AppIcon } from "@/components/app-icon";

// iPhone "Bosh ekranga qo'shish" ikonkasi
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIcon size={size.width} />, size);
}
