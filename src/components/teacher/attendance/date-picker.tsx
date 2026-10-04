"use client";

import { usePathname, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function AttendanceDatePicker({
  date,
  max,
}: {
  date: string;
  max: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Input
      type="date"
      aria-label="Sana"
      className="w-44"
      value={date}
      max={max}
      onChange={(e) => {
        const value = e.target.value;
        if (value && value <= max) router.replace(`${pathname}?date=${value}`);
      }}
    />
  );
}
