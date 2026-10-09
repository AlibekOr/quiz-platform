"use client";

import { useState, useTransition } from "react";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createRegion,
  renameRegion,
} from "@/app/(teacher)/teacher/managers/actions";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";

export type RegionRow = {
  id: string;
  name: string;
  groupCount: number;
  managerCount: number;
};

function errorText(result: ActionResult): string | undefined {
  return result.ok
    ? undefined
    : (result.fieldErrors?.name?.[0] ?? result.error);
}

/** Regionlar: qo'shish va nomini o'zgartirish. Guruh regioni "Guruhlar" sahifasida tanlanadi */
export function RegionsSection({ regions }: { regions: RegionRow[] }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  function add(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createRegion({ name });
      if (result.ok) {
        toast.success(result.message);
        setName("");
        setError(undefined);
      } else setError(errorText(result));
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-semibold">Regionlar</h2>
      {regions.length > 0 && (
        <ul className="flex flex-col divide-y text-sm">
          {regions.map((r) => (
            <RegionItem key={r.id} region={r} />
          ))}
        </ul>
      )}
      <form onSubmit={add} className="flex flex-col gap-2" noValidate>
        <div className="flex gap-2">
          <Input
            placeholder="Yangi region nomi"
            aria-label="Region nomi"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit" disabled={pending}>
            Qo&apos;shish
          </Button>
        </div>
        <FormError message={error} />
      </form>
    </section>
  );
}

function RegionItem({ region }: { region: RegionRow }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(region.name);
  const [error, setError] = useState<string>();

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await renameRegion(region.id, { name });
      if (result.ok) {
        toast.success(result.message);
        setEditing(false);
        setError(undefined);
      } else setError(errorText(result));
    });
  }

  if (editing)
    return (
      <li className="py-2">
        <form onSubmit={save} className="flex flex-col gap-1" noValidate>
          <div className="flex gap-2">
            <Input
              aria-label="Region nomi"
              maxLength={60}
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={pending}>
              Saqlash
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setName(region.name);
                setError(undefined);
              }}
            >
              Bekor
            </Button>
          </div>
          <FormError message={error} />
        </form>
      </li>
    );

  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <span>
        <span className="font-medium">{region.name}</span>
        <span className="text-muted-foreground">
          {" "}
          · {region.groupCount} guruh, {region.managerCount} menejer
        </span>
      </span>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={`${region.name}: nomini o'zgartirish`}
        onClick={() => setEditing(true)}
      >
        <PencilIcon />
      </Button>
    </li>
  );
}
