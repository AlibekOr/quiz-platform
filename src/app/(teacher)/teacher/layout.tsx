import { LogoutButton } from "@/components/auth/logout-button";
import { MobileNav } from "@/components/teacher/mobile-nav";
import { NavLinks } from "@/components/teacher/nav-links";
import { getCurrentUser } from "@/lib/auth/guards";

// Layout faqat ko'rinish uchun; har bir sahifa o'zi requireTeacher() chaqiradi
export default async function TeacherLayout({
  children,
}: LayoutProps<"/teacher">) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-full flex-1">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r p-4 md:flex">
        <span className="px-3 font-semibold">Test platformasi</span>
        <NavLinks />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <MobileNav />
            </div>
            <span className="text-muted-foreground text-sm">
              {user?.fullName}
            </span>
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
