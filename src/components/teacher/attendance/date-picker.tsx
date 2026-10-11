"use client";

import { usePathname, useRouter } from "next/navigation";
import { DatePicker } from "@/components/common/date-picker";

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
    <DatePicker
      aria-label="Sana"
      className="w-44"
      value={date}
      max={max}
      onChange={(value) => {
        if (value && value <= max) router.replace(`${pathname}?date=${value}`);
      }}
    />
  );
}
