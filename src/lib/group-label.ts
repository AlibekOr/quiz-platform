// Guruh nomi takrorlanishi mumkin — ro'yxat va tanlashlarda kod bilan birga (ROLES.md)

export type GroupNaming = { name: string; code: string | null };

/** "Frontend-1 · SHOA-1-SH" (kod hali yo'q bo'lsa — faqat nom) */
export function groupLabel(group: GroupNaming): string {
  return group.code ? `${group.name} · ${group.code}` : group.name;
}
