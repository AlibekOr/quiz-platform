"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheckIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  InboxIcon,
  LayoutDashboardIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Faqat aynan shu yo'lda faol (bosh sahifa) */
  exact?: boolean;
};

export type NavVariant = "teacher" | "manager";

// Ikonkalar server'dan prop sifatida o'tkazilmaydi — ro'yxatlar shu yerda
const LINKS: Record<NavVariant, NavLink[]> = {
  teacher: [
    {
      href: "/teacher",
      label: "Bosh sahifa",
      icon: LayoutDashboardIcon,
      exact: true,
    },
    { href: "/teacher/groups", label: "Guruhlar", icon: UsersRoundIcon },
    { href: "/teacher/students", label: "O'quvchilar", icon: UsersIcon },
    { href: "/teacher/attendance", label: "Davomat", icon: CalendarCheckIcon },
    { href: "/teacher/tests", label: "Testlar", icon: ClipboardListIcon },
    {
      href: "/teacher/homework",
      label: "Uyga vazifalar",
      icon: BookOpenCheckIcon,
    },
    { href: "/teacher/grades", label: "Baholar", icon: GraduationCapIcon },
    { href: "/teacher/managers", label: "Menejerlar", icon: BriefcaseIcon },
    { href: "/teacher/requests", label: "So'rovlar", icon: InboxIcon },
    { href: "/leaderboard", label: "Reyting", icon: TrophyIcon },
    { href: "/teacher/account", label: "Profil", icon: UserIcon },
  ],
  manager: [
    {
      href: "/manager",
      label: "Bosh sahifa",
      icon: LayoutDashboardIcon,
      exact: true,
    },
    { href: "/manager/students", label: "O'quvchilar", icon: UsersIcon },
    { href: "/manager/attendance", label: "Davomat", icon: CalendarCheckIcon },
    { href: "/manager/tests", label: "Testlar", icon: ClipboardListIcon },
    { href: "/leaderboard", label: "Reyting", icon: TrophyIcon },
    { href: "/manager/requests", label: "So'rovlarim", icon: InboxIcon },
  ],
};

export function NavLinks({
  variant,
  badges = {},
  onNavigate,
}: {
  variant: NavVariant;
  /** href -> son (masalan, kutilayotgan so'rovlar); 0 bo'lsa ko'rsatilmaydi */
  badges?: Record<string, number>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS[variant].map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        const count = badges[href] ?? 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active && "bg-accent text-accent-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {count > 0 && (
              <Badge
                variant="destructive"
                aria-label={`${count} ta kutilmoqda`}
              >
                {count}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
