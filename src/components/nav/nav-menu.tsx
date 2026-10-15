"use client";

import { useEffect, useId, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArchiveIcon,
  BookOpenCheckIcon,
  BriefcaseIcon,
  CalendarCheckIcon,
  ChevronDownIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  GavelIcon,
  GraduationCapIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinIcon,
  SettingsIcon,
  TableIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { logout } from "@/lib/auth/actions";
import {
  activeGroupId,
  activeHref,
  flattenNav,
  groupBadge,
  isGroupOpen,
  isNavGroup,
  parseOpenState,
  type NavGroupItem,
  type NavLinkItem,
} from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * prefetch — Link oldindan yuklansinmi. Har bir prefetch — Vercel'da alohida funksiya
 * chaqiruvi, shuning uchun faqat eng ko'p ochiladigan 1-2 sahifada yoqilgan
 */
type MenuLink = NavLinkItem & { icon: LucideIcon; prefetch?: boolean };
type MenuGroup = NavGroupItem<MenuLink> & { icon: LucideIcon };
type MenuItem = MenuLink | MenuGroup;

export type NavVariant = "teacher" | "manager" | "student";

const PROFILE: MenuLink = { href: "/profile", label: "Profil", icon: UserIcon };

// Ikonkalar server'dan prop sifatida o'tkazilmaydi — ro'yxatlar shu yerda
const MENUS: Record<NavVariant, { main: MenuItem[]; footer: MenuLink[] }> = {
  teacher: {
    main: [
      {
        href: "/teacher",
        label: "Bosh sahifa",
        icon: LayoutDashboardIcon,
        exact: true,
        prefetch: true,
      },
      { href: "/teacher/groups", label: "Guruhlar", icon: UsersRoundIcon },
      { href: "/teacher/students", label: "O'quvchilar", icon: UsersIcon },
      {
        id: "attendance",
        label: "Davomat",
        icon: CalendarCheckIcon,
        children: [
          {
            href: "/teacher/attendance",
            label: "Davomat yuritish",
            icon: ClipboardCheckIcon,
            prefetch: true,
          },
          {
            href: "/teacher/attendance/report",
            label: "Davomat hisoboti",
            icon: TableIcon,
          },
        ],
      },
      {
        id: "grading",
        label: "Umumiy baholash",
        icon: GraduationCapIcon,
        children: [
          {
            href: "/teacher/homework",
            label: "Uyga vazifalar",
            icon: BookOpenCheckIcon,
          },
          { href: "/teacher/tests", label: "Testlar", icon: ClipboardListIcon },
          {
            href: "/teacher/grades",
            label: "Baholar",
            icon: GraduationCapIcon,
          },
          { href: "/leaderboard", label: "Reyting", icon: TrophyIcon },
        ],
      },
      {
        id: "settings",
        label: "Sozlamalar",
        icon: SettingsIcon,
        children: [
          {
            href: "/teacher/managers",
            label: "Menejerlar",
            icon: BriefcaseIcon,
          },
          { href: "/teacher/requests", label: "So'rovlar", icon: InboxIcon },
          { href: "/teacher/regions", label: "Regionlar", icon: MapPinIcon },
          {
            href: "/teacher/penalties",
            label: "Jarima shablonlari",
            icon: GavelIcon,
          },
          { href: "/teacher/archive", label: "Arxiv", icon: ArchiveIcon },
        ],
      },
    ],
    footer: [PROFILE],
  },
  manager: {
    main: [
      {
        href: "/manager",
        label: "Bosh sahifa",
        icon: LayoutDashboardIcon,
        exact: true,
        prefetch: true,
      },
      {
        href: "/manager/students",
        label: "O'quvchilar",
        icon: UsersIcon,
        prefetch: true,
      },
      {
        href: "/manager/attendance",
        label: "Davomat",
        icon: CalendarCheckIcon,
      },
      { href: "/manager/tests", label: "Testlar", icon: ClipboardListIcon },
      { href: "/leaderboard", label: "Reyting", icon: TrophyIcon },
      { href: "/manager/requests", label: "So'rovlarim", icon: InboxIcon },
    ],
    footer: [PROFILE],
  },
  student: {
    main: [
      {
        href: "/dashboard",
        label: "Bosh sahifa",
        icon: LayoutDashboardIcon,
        exact: true,
        prefetch: true,
      },
      {
        href: "/homework",
        label: "Vazifalar",
        icon: BookOpenCheckIcon,
        prefetch: true,
      },
      { href: "/grades", label: "Baholarim", icon: GraduationCapIcon },
      { href: "/leaderboard", label: "Reyting", icon: TrophyIcon },
    ],
    footer: [PROFILE],
  },
};

// ---------- Ochiq/yopiq holat: localStorage (yon panel va mobil menyu bir xil) ----------

const listeners = new Set<() => void>();
/** localStorage ishlamasa (yashirin rejim) — sahifa ochiq turguncha xotirada */
const memory = new Map<string, string>();

function readState(key: string): string | null {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

function writeState(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // saqlab bo'lmadi — xotiradagi qiymat yetarli
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function setGroupOpen(key: string, groupId: string, open: boolean) {
  const current = parseOpenState(readState(key));
  if (current[groupId] === open) return;
  writeState(key, JSON.stringify({ ...current, [groupId]: open }));
}

// ---------- Komponentlar ----------

const ITEM_CLASS =
  "text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Badge variant="destructive" aria-label={`${count} ta kutilmoqda`}>
      {count}
    </Badge>
  );
}

function NavLinkRow({
  link,
  active,
  count,
  onNavigate,
}: {
  link: MenuLink;
  active: boolean;
  count: number;
  onNavigate?: () => void;
}) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      // Default (auto): dinamik sahifada faqat loading.tsx gacha yuklanadi
      prefetch={link.prefetch ? undefined : false}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(ITEM_CLASS, active && "bg-accent text-accent-foreground")}
    >
      <Icon className="size-4" />
      <span className="flex-1">{link.label}</span>
      <CountBadge count={count} />
    </Link>
  );
}

function NavGroupRow({
  group,
  open,
  onToggle,
  active,
  badges,
  onNavigate,
}: {
  group: MenuGroup;
  open: boolean;
  onToggle: () => void;
  active: string | null;
  badges: Record<string, number>;
  onNavigate?: () => void;
}) {
  const listId = useId();
  const Icon = group.icon;
  const containsActive = group.children.some((c) => c.href === active);
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={listId}
        className={cn(ITEM_CLASS, containsActive && "text-foreground")}
      >
        <Icon className="size-4" />
        <span className="flex-1 text-left">{group.label}</span>
        {!open && <CountBadge count={groupBadge(group, badges)} />}
        <ChevronDownIcon
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </button>
      <div
        id={listId}
        hidden={!open}
        className="ml-4 flex flex-col gap-1 border-l pl-2"
      >
        {group.children.map((link) => (
          <NavLinkRow
            key={link.href}
            link={link}
            active={link.href === active}
            count={badges[link.href] ?? 0}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

/** Yon panel va mobil menyu mazmuni: asosiy bandlar, pastda Profil va Chiqish */
export function NavMenu({
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
  const { main, footer } = MENUS[variant];
  const active = activeHref(pathname, [...flattenNav(main), ...footer]);
  const activeGroup = activeGroupId(main, active);
  const storageKey = `nav-open:${variant}`;
  const openState = parseOpenState(
    useSyncExternalStore(
      subscribe,
      () => readState(storageKey),
      () => null,
    ),
  );

  // Boshqa guruhdagi sahifaga o'tilganda o'sha guruh ochiladi (holat saqlanadi)
  useEffect(() => {
    if (activeGroup) setGroupOpen(storageKey, activeGroup, true);
  }, [storageKey, activeGroup]);

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {main.map((item) => {
        if (!isNavGroup(item))
          return (
            <NavLinkRow
              key={item.href}
              link={item}
              active={item.href === active}
              count={badges[item.href] ?? 0}
              onNavigate={onNavigate}
            />
          );
        const open = isGroupOpen(item.id, openState, activeGroup);
        return (
          <NavGroupRow
            key={item.id}
            group={item}
            open={open}
            onToggle={() => setGroupOpen(storageKey, item.id, !open)}
            active={active}
            badges={badges}
            onNavigate={onNavigate}
          />
        );
      })}

      <div className="mt-auto flex flex-col gap-1 pt-4">
        <Separator className="mb-2" />
        {footer.map((link) => (
          <NavLinkRow
            key={link.href}
            link={link}
            active={link.href === active}
            count={0}
            onNavigate={onNavigate}
          />
        ))}
        <form action={logout}>
          <button type="submit" className={ITEM_CLASS}>
            <LogOutIcon className="size-4" />
            <span className="flex-1 text-left">Chiqish</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
