"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { XIcon } from "lucide-react";

// ---------- Yopilgan ogohlantirish: localStorage (faqat shu brauzerda) ----------

const STORAGE_KEY = "missing-homework-dismissed";
/** Server render: holat noma'lum — ogohlantirish yopilgan bo'lsa miltillamasin */
const SERVER = "\u0000ssr";

const listeners = new Set<() => void>();
/** localStorage ishlamasa (yashirin rejim) — sahifa ochiq turguncha xotirada */
let memory: string | null = null;

function readState(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? memory;
  } catch {
    return memory;
  }
}

function writeState(value: string) {
  memory = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // saqlab bo'lmadi — xotiradagi qiymat yetarli
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function parseIds(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const value: unknown = JSON.parse(raw);
    return new Set(
      Array.isArray(value)
        ? value.filter((v): v is string => typeof v === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

/**
 * Yopiladigan ogohlantirish. Yopilganda shu darslar eslab qolinadi; ro'yxatga yangi dars
 * qo'shilsa ogohlantirish yana chiqadi
 */
export function DismissibleNotice({
  ids,
  children,
}: {
  ids: string[];
  children: ReactNode;
}) {
  const raw = useSyncExternalStore(subscribe, readState, () => SERVER);
  if (raw === SERVER) return null;
  const dismissed = parseIds(raw);
  if (ids.every((id) => dismissed.has(id))) return null;
  return children;
}

export function DismissButton({ ids }: { ids: string[] }) {
  return (
    <button
      type="button"
      aria-label="Ogohlantirishni yopish"
      title="Yopish"
      className="text-muted-foreground hover:text-foreground -m-1 rounded p-1"
      onClick={(e) => {
        // <summary> ichida — ro'yxat ochilib-yopilmasin
        e.preventDefault();
        e.stopPropagation();
        writeState(JSON.stringify(ids));
      }}
    >
      <XIcon className="size-4" />
    </button>
  );
}
