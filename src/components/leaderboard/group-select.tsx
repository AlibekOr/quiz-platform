"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export function LeaderboardGroupSelect({
  groups,
  value,
}: {
  groups: { id: string; name: string }[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <NativeSelect
      aria-label="Guruh"
      value={value}
      onChange={(e) =>
        router.replace(`${pathname}?scope=group&groupId=${e.target.value}`)
      }
    >
      {groups.map((g) => (
        <NativeSelectOption key={g.id} value={g.id}>
          {g.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
