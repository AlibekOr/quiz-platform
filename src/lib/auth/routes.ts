import type { Role } from "./jwt";

// Sahifa yo'li bo'yicha ruxsat etilgan rollar (proxy.ts optimistik yo'naltirish uchun).
// Asosiy himoya baribir har sahifa/action ichidagi require*() — bu faqat qulaylik

function under(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** null — cheklov yo'q (masalan, /login) */
export function allowedRoles(pathname: string): readonly Role[] | null {
  if (under(pathname, "/teacher")) return ["TEACHER"];
  if (under(pathname, "/manager")) return ["MANAGER"];
  // Reyting: hamma rol (menejer faqat o'z doirasini ko'radi — leaderboard-access.ts)
  if (
    under(pathname, "/leaderboard") ||
    /^\/test\/[^/]+\/leaderboard$/.test(pathname)
  )
    return ["TEACHER", "MANAGER", "STUDENT"];
  if (
    under(pathname, "/dashboard") ||
    under(pathname, "/test") ||
    under(pathname, "/result") ||
    under(pathname, "/grades")
  )
    return ["STUDENT"];
  return null;
}
