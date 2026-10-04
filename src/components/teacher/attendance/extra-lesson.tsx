"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

/** Jadvalda bo'lmagan kunga dars: dars birinchi saqlashda yaratiladi */
export function ExtraLesson({
  date,
  groups,
}: {
  date: string;
  groups: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [groupId, setGroupId] = useState("");
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
      <span className="text-sm font-medium">Qo&apos;shimcha dars:</span>
      <NativeSelect
        aria-label="Guruh"
        value={groupId}
        onChange={(e) => setGroupId(e.target.value)}
      >
        <NativeSelectOption value="">Guruhni tanlang</NativeSelectOption>
        {groups.map((g) => (
          <NativeSelectOption key={g.id} value={g.id}>
            {g.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button
        variant="outline"
        disabled={!groupId}
        onClick={() => router.push(`/teacher/attendance/${groupId}/${date}`)}
      >
        <PlusIcon />
        Davomat belgilash
      </Button>
    </div>
  );
}
