import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { getCurrentUser } from "@/lib/auth/guards";
import { homePathFor } from "@/lib/auth/jwt";

// Layout faqat ko'rinish uchun; har bir sahifa o'zi requireStudent()/requireUser() chaqiradi.
// Reyting sahifalarini o'qituvchi ham ochadi, shuning uchun havolalar rolga qarab
export default async function StudentLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const home = user ? homePathFor(user.role) : "/login";
  const links =
    user?.role === "TEACHER" || user?.role === "MANAGER"
      ? [
          {
            href: homePathFor(user.role),
            label:
              user.role === "TEACHER" ? "O'qituvchi paneli" : "Menejer paneli",
          },
          { href: "/leaderboard", label: "Reyting" },
        ]
      : [
          { href: "/dashboard", label: "Testlarim" },
          { href: "/grades", label: "Baholarim" },
          { href: "/leaderboard", label: "Reyting" },
        ];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href={home} className="font-semibold">
              Test platformasi
            </Link>
            <nav className="text-muted-foreground flex gap-3 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:inline">
              {user?.fullName}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:py-6">
        {children}
      </main>
    </div>
  );
}
