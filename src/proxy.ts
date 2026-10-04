import { NextResponse, type NextRequest } from "next/server";
import { decodeSession, homePathFor, SESSION_COOKIE } from "@/lib/auth/jwt";

// Faqat optimistik yo'naltirish (cookie bo'yicha). Asosiy himoya — lib/auth/guards.ts
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await decodeSession(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  if (pathname === "/login") return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    session.role === "STUDENT" &&
    (pathname === "/teacher" || pathname.startsWith("/teacher/"))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(homePathFor(session.role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  // API o'zi 401 qaytaradi; statik fayllar himoyalanmaydi
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
