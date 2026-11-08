"use client";

import { useState, useTransition } from "react";
import { ArchiveRestoreIcon, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  acceptSharedTestsAction,
  setSharedTestsDismissedAction,
} from "@/app/(teacher)/teacher/tests/actions";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import type { SharedTest, SharedView } from "@/lib/tests/sharing";
import { cn } from "@/lib/utils";

/**
 * "Menga ulashilgan": tanlab yoki hammasini birdan qabul qilish (nusxa) yoki olib tashlash.
 * Olib tashlanganlar alohida ro'yxatda — u yerdan qaytariladi
 */
export function SharedTestsList({
  tests,
  view,
}: {
  tests: SharedTest[];
  view: SharedView;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  // Qabul qilingan / olib tashlanganlar sahifa yangilanganda ro'yxatdan chiqadi
  const chosen = tests.filter((t) => selected.has(t.id)).map((t) => t.id);
  const allSelected = tests.length > 0 && chosen.length === tests.length;

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        setSelected(new Set());
      } else toast.error(result.error);
    });
  }

  const accept = (ids: string[]) => run(() => acceptSharedTestsAction(ids));
  const dismiss = (ids: string[]) =>
    run(() => setSharedTestsDismissedAction(ids, view === "new"));

  if (tests.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        {view === "new"
          ? "Yangi ulashilgan test yo'q."
          : "Olib tashlangan test yo'q."}
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-background sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
        <label className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={allSelected}
            onChange={(e) =>
              setSelected(
                e.target.checked ? new Set(tests.map((t) => t.id)) : new Set(),
              )
            }
          />
          Hammasini tanlash ({tests.length})
        </label>
        {chosen.length > 0 && (
          <span className="text-muted-foreground">
            · {chosen.length} ta tanlandi
          </span>
        )}
        <span className="ml-auto flex flex-wrap gap-1">
          {view === "new" && (
            <Button
              size="sm"
              disabled={pending || chosen.length === 0}
              onClick={() => accept(chosen)}
            >
              <PlusIcon />
              Qo&apos;shish
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={pending || chosen.length === 0}
            onClick={() => dismiss(chosen)}
          >
            {view === "new" ? <XIcon /> : <ArchiveRestoreIcon />}
            {view === "new" ? "Olib tashlash" : "Qaytarish"}
          </Button>
        </span>
      </div>

      <ul className="divide-y rounded-lg border text-sm">
        {tests.map((t) => (
          <li
            key={t.id}
            className={cn(
              "flex flex-wrap items-center gap-3 p-3",
              selected.has(t.id) && "bg-muted/50",
            )}
          >
            <label className="flex min-w-0 flex-1 items-center gap-3">
              <input
                type="checkbox"
                className="accent-primary size-4 shrink-0"
                checked={selected.has(t.id)}
                onChange={(e) => toggle(t.id, e.target.checked)}
              />
              <span className="min-w-0">
                <span className="block font-medium break-words">{t.title}</span>
                <span className="text-muted-foreground block text-xs">
                  {t.author} · {t.questionCount} ta savol
                </span>
              </span>
            </label>
            <span className="flex gap-1">
              {view === "new" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => accept([t.id])}
                >
                  <PlusIcon />
                  Qo&apos;shish
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                aria-label={view === "new" ? "Olib tashlash" : "Qaytarish"}
                onClick={() => dismiss([t.id])}
              >
                {view === "new" ? <XIcon /> : <ArchiveRestoreIcon />}
                {view === "hidden" && "Qaytarish"}
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
