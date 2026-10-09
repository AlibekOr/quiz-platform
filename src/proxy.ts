import { NextResponse, type NextRequest } from "next/server";
import { decodeSession, homePathFor, SESSION_COOKIE } from "@/lib/auth/jwt";
import { allowedRoles } from "@/lib/auth/routes";

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

  // Har rol faqat o'z sahifalariga; boshqasiga kirsa — o'z bosh sahifasiga
  const roles = allowedRoles(pathname);
  if (roles && !roles.includes(session.role)) {
    return NextResponse.redirect(
      new URL(homePathFor(session.role), request.url),
    );
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
