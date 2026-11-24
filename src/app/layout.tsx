import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  siteUrl,
} from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  // Ichki sahifalar indekslanmaydi; ochiq sahifa (login) o'zi index: true qiladi
  robots: { index: false, follow: false },
  // Google Search Console tasdiqlash kodi (ixtiyoriy)
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  // iPhone'da bosh ekrandan ochilganda ilova kabi (manifest — app/manifest.ts)
  appleWebApp: { capable: true, title: "Testlar", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uz"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-center" />
        {/* Vercel: tashriflar va tezlik statistikasi (cookie yo'q, shaxsiy ma'lumot yig'ilmaydi) */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
