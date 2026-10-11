"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

/** Oy tanlash: boshqa URL parametrlari (masalan, guruh) saqlanadi */
export function MonthPicker({ month, max }: { month: string; max: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <Input
      type="month"
      aria-label="Oy"
      className="w-44"
      value={month}
      max={max}
      onChange={(e) => {
        if (!e.target.value) return;
        const params = new URLSearchParams(searchParams);
        params.set("month", e.target.value);
        router.replace(`${pathname}?${params}`);
      }}
    />
  );
}
