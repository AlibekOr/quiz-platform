"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

/** URL parametrini o'zgartiradigan select (filtrlar uchun). `reset` — birga tozalanadigan parametrlar */
export function ParamSelect({
  name,
  value,
  options,
  label,
  placeholder,
  reset = [],
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  label: string;
  placeholder?: string;
  reset?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(next: string) {
    const params = new URLSearchParams(searchParams);
    for (const key of reset) params.delete(key);
    if (next) params.set(name, next);
    else params.delete(name);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={(e) => update(e.target.value)}
    >
      {placeholder !== undefined && (
        <NativeSelectOption value="" disabled>
          {placeholder}
        </NativeSelectOption>
      )}
      {options.map((o) => (
        <NativeSelectOption key={o.value} value={o.value}>
          {o.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
