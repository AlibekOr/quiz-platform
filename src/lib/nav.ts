// Yon panel mantig'i (sof funksiyalar): faol band va ochiladigan guruhlar

export type NavLinkItem = {
  href: string;
  label: string;
  /** Faqat aynan shu yo'lda faol (bosh sahifa) */
  exact?: boolean;
};

export type NavGroupItem<L extends NavLinkItem = NavLinkItem> = {
  /** localStorage kaliti uchun barqaror id */
  id: string;
  label: string;
  children: L[];
};

export type NavItem<L extends NavLinkItem = NavLinkItem> = L | NavGroupItem<L>;

export function isNavGroup<L extends NavLinkItem>(
  item: NavItem<L>,
): item is NavGroupItem<L> {
  return "children" in item;
}

function matches(pathname: string, link: NavLinkItem): boolean {
  if (pathname === link.href) return true;
  return !link.exact && pathname.startsWith(`${link.href}/`);
}

/**
 * Faol havola: yo'lga mos keladiganlardan eng uzuni. Masalan, /teacher/attendance/report
 * "Davomat hisoboti"ni faol qiladi, "Davomat yuritish" (/teacher/attendance) ni emas
 */
export function activeHref(
  pathname: string,
  links: readonly NavLinkItem[],
): string | null {
  let best: string | null = null;
  for (const link of links) {
    if (matches(pathname, link) && (!best || link.href.length > best.length))
      best = link.href;
  }
  return best;
}

export function flattenNav<L extends NavLinkItem>(
  items: readonly NavItem<L>[],
): L[] {
  return items.flatMap((item) => (isNavGroup(item) ? item.children : [item]));
}

/** Faol havola joylashgan guruh id'si (guruhsiz bo'lsa null) */
export function activeGroupId(
  items: readonly NavItem[],
  active: string | null,
): string | null {
  if (!active) return null;
  for (const item of items) {
    if (isNavGroup(item) && item.children.some((c) => c.href === active))
      return item.id;
  }
  return null;
}

/** Guruh badge'i: bolalar badge'larining yig'indisi (guruh yopiq bo'lganda ko'rsatiladi) */
export function groupBadge(
  group: NavGroupItem,
  badges: Readonly<Record<string, number>>,
): number {
  return group.children.reduce((sum, c) => sum + (badges[c.href] ?? 0), 0);
}

/** Saqlangan ochiq/yopiq holat (localStorage JSON). Buzilgan qiymat — bo'sh */
export function parseOpenState(raw: string | null): Record<string, boolean> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        (e): e is [string, boolean] => typeof e[1] === "boolean",
      ),
    );
  } catch {
    return {};
  }
}

/** Guruh ochiqmi: saqlangan holat, aks holda faol guruh ochiq */
export function isGroupOpen(
  groupId: string,
  state: Readonly<Record<string, boolean>>,
  activeGroup: string | null,
): boolean {
  return state[groupId] ?? groupId === activeGroup;
}
