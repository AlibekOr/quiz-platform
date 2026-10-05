"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

/** Guruh filtri: tanlov URL'ga yoziladi (saralash saqlanadi) */
export function ResultsGroupFilter({
  groups,
  value,
}: {
  groups: { id: string; name: string }[];
  value: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <NativeSelect
      aria-label="Guruh"
      value={value ?? ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        if (e.target.value) params.set("groupId", e.target.value);
        else params.delete("groupId");
        router.replace(`${pathname}?${params}`);
      }}
    >
      <NativeSelectOption value="">Barcha guruhlar</NativeSelectOption>
      {groups.map((g) => (
        <NativeSelectOption key={g.id} value={g.id}>
          {g.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
