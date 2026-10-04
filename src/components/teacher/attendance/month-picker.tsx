"use client";

import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function MonthPicker({ month, max }: { month: string; max: string }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Input
      type="month"
      aria-label="Oy"
      className="w-44"
      value={month}
      max={max}
      onChange={(e) =>
        e.target.value && router.replace(`${pathname}?month=${e.target.value}`)
      }
    />
  );
}
