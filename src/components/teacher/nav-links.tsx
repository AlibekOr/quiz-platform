"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheckIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "/teacher",
    label: "Bosh sahifa",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  { href: "/teacher/attendance", label: "Davomat", icon: CalendarCheckIcon },
  { href: "/teacher/groups", label: "Guruhlar", icon: UsersRoundIcon },
  { href: "/teacher/students", label: "O'quvchilar", icon: UsersIcon },
  { href: "/teacher/tests", label: "Testlar", icon: ClipboardListIcon },
  {
    href: "/teacher/homework",
    label: "Uyga vazifalar",
    icon: BookOpenCheckIcon,
  },
  { href: "/teacher/grades", label: "Baholar", icon: GraduationCapIcon },
  { href: "/leaderboard", label: "Reyting", icon: TrophyIcon },
  { href: "/teacher/account", label: "Profil", icon: UserIcon },
] as const;

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ href, label, icon: Icon, ...rest }) => {
        const active =
          "exact" in rest ? pathname === href : pathname.startsWith(href);
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
