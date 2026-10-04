"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { GroupOption } from "./types";

export function StudentFilters({ groups }: { groups: GroupOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  useEffect(() => {
    if (query === (searchParams.get("q") ?? "")) return;
    const timer = setTimeout(() => update("q", query.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat matn o'zgarganda
  }, [query]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        type="search"
        placeholder="Ism, login, telefon yoki Telegram"
        aria-label="Qidirish"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="sm:max-w-xs"
      />
      <NativeSelect
        aria-label="Guruh bo'yicha filtr"
        value={searchParams.get("group") ?? ""}
        onChange={(e) => update("group", e.target.value)}
      >
        <NativeSelectOption value="">Barcha guruhlar</NativeSelectOption>
        {groups.map((g) => (
          <NativeSelectOption key={g.id} value={g.id}>
            {g.name}
          </NativeSelectOption>
        ))}
        <NativeSelectOption value="none">Guruhsiz</NativeSelectOption>
      </NativeSelect>
    </div>
  );
}
