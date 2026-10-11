import type { CurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { MobileNav } from "./mobile-nav";
import { NavMenu, type NavVariant } from "./nav-menu";

const TITLES: Record<NavVariant, string> = {
  teacher: "Test platformasi",
  manager: "Menejer paneli",
  student: "Test platformasi",
};

function variantFor(user: CurrentUser | null): NavVariant {
  if (user?.role === "TEACHER") return "teacher";
  if (user?.role === "MANAGER") return "manager";
  return "student";
}

/**
 * Barcha rollar uchun umumiy karkas: yon panel, telefonda hamburger menyu.
 * Menyu rolga qarab tanlanadi (reyting sahifalarini o'qituvchi va menejer ham ochadi).
 * Faqat ko'rinish uchun — har bir sahifa o'zi require*() chaqiradi
 */
export async function AppShell({
  user,
  children,
}: {
  user: CurrentUser | null;
  children: React.ReactNode;
}) {
  const variant = variantFor(user);
  const badges: Record<string, number> =
    variant === "teacher"
      ? {
          "/teacher/requests": await db.deletionRequest.count({
            where: { status: "PENDING" },
          }),
        }
      : {};

  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4 md:flex">
        <span className="px-3 font-semibold">{TITLES[variant]}</span>
        <NavMenu variant={variant} badges={badges} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b px-4 py-3 md:hidden">
          <MobileNav
            variant={variant}
            title={TITLES[variant]}
            badges={badges}
          />
          <span className="text-muted-foreground truncate text-sm">
            {user?.fullName}
          </span>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
