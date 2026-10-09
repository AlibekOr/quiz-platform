import { LogoutButton } from "@/components/auth/logout-button";
import { MobileNav } from "./mobile-nav";
import { NavLinks, type NavVariant } from "./nav-links";

/** O'qituvchi va menejer sahifalari uchun umumiy karkas: yon panel, telefonda hamburger menyu */
export function StaffShell({
  variant,
  title,
  userName,
  badges,
  children,
}: {
  variant: NavVariant;
  title: string;
  userName: string | undefined;
  badges?: Record<string, number>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r p-4 md:flex">
        <span className="px-3 font-semibold">{title}</span>
        <NavLinks variant={variant} badges={badges} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <MobileNav variant={variant} badges={badges} />
            </div>
            <span className="text-muted-foreground text-sm">{userName}</span>
          </div>
          <LogoutButton />
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
