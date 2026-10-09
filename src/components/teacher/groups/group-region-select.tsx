"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setGroupRegion } from "@/app/(teacher)/teacher/groups/actions";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

/** Guruhlar jadvalida: guruh regionini darhol o'zgartirish (menejerlar doirasiga ta'sir qiladi) */
export function GroupRegionSelect({
  groupId,
  groupName,
  regionId,
  regions,
}: {
  groupId: string;
  groupName: string;
  regionId: string | null;
  regions: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <NativeSelect
      size="sm"
      aria-label={`${groupName}: region`}
      value={regionId ?? ""}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          const result = await setGroupRegion(groupId, next);
          if (result.ok) toast.success(result.message);
          else toast.error(result.error);
        });
      }}
    >
      <NativeSelectOption value="">—</NativeSelectOption>
      {regions.map((r) => (
        <NativeSelectOption key={r.id} value={r.id}>
          {r.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
