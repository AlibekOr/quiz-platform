"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MonthPicker as MonthSelect } from "@/components/common/date-picker";

/** Oy tanlash: boshqa URL parametrlari (masalan, guruh) saqlanadi */
export function MonthPicker({ month, max }: { month: string; max: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <MonthSelect
      aria-label="Oy"
      className="w-auto"
      value={month}
      max={max}
      onChange={(value) => {
        const params = new URLSearchParams(searchParams);
        params.set("month", value);
        router.replace(`${pathname}?${params}`);
      }}
    />
  );
}
