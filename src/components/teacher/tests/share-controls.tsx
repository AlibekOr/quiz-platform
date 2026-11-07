"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { ChevronRightIcon, CopyIcon, Share2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
  copySharedTestAction,
  regionShareTeachersAction,
  searchShareTeachersAction,
  shareTestAction,
  shareTestsAction,
} from "@/app/(teacher)/teacher/tests/actions";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ShareSearchResult, ShareTargets } from "@/lib/tests/sharing";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

export type ShareOptions = ShareTargets & {
  regionIds: string[];
  teachers: Option[];
};

/** Tanlangan o'qituvchilar: id → ism (chiplarda ko'rsatish uchun) */
type Picked = ReadonlyMap<string, string>;

function toggle(set: ReadonlySet<string>, id: string, on: boolean) {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

function togglePicked(picked: Picked, teacher: Option, on: boolean) {
  const next = new Map(picked);
  if (on) next.set(teacher.id, teacher.name);
  else next.delete(teacher.id);
  return next;
}

function TeacherList({
  teachers,
  picked,
  onChange,
}: {
  teachers: (Option & { hint?: string })[];
  picked: Picked;
  onChange: (next: Map<string, string>) => void;
}) {
  if (teachers.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        Boshqa o&apos;qituvchi yo&apos;q.
      </p>
    );
  return (
    <div className="flex flex-col gap-2">
      {teachers.map((t) => (
        <label key={t.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4 shrink-0"
            checked={picked.has(t.id)}
            onChange={(e) =>
              onChange(togglePicked(picked, t, e.target.checked))
            }
          />
          <span className="min-w-0">
            {t.name}
            {t.hint && (
              <span className="text-muted-foreground ml-1 text-xs">
                · {t.hint}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}

/** "none" — regionsiz o'qituvchilar */
const NO_REGION = "none";

/**
 * Avval region, keyin undagi o'qituvchilar (ochilganda serverdan yuklanadi). Butun
 * regionga — faqat o'z regionlari; alohida o'qituvchilarga — istalgan regiondan
 */
function ShareTargetsPicker({
  targets,
  regions,
  teachers,
  onRegionsChange,
  onTeachersChange,
}: {
  targets: ShareTargets;
  regions: ReadonlySet<string>;
  teachers: Picked;
  onRegionsChange: (next: Set<string>) => void;
  onTeachersChange: (next: Map<string, string>) => void;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [loaded, setLoaded] = useState<Record<string, Option[]>>({});
  const [found, setFound] = useState<ShareSearchResult & { query: string }>();
  const q = query.trim();

  // Qidiruv serverda (o'qituvchilar ko'p bo'lishi mumkin); kichik kechikish bilan
  useEffect(() => {
    if (q.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await searchShareTeachersAction(q);
      if (!cancelled) setFound({ ...result, query: q });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  async function expand(key: string) {
    const open = !expanded.has(key);
    setExpanded(toggle(expanded, key, open));
    if (!open || loaded[key]) return;
    const list = await regionShareTeachersAction(
      key === NO_REGION ? null : key,
    );
    setLoaded((prev) => ({ ...prev, [key]: list }));
  }

  const rows = [
    ...targets.regions,
    ...(targets.unassignedCount > 0
      ? [
          {
            id: NO_REGION,
            name: "Regionsiz",
            own: false,
            teacherCount: targets.unassignedCount,
          },
        ]
      : []),
  ];
  const lower = q.toLowerCase();
  const shownRows = q
    ? rows.filter((r) => r.name.toLowerCase().includes(lower))
    : rows;
  const searching = q.length >= 2;
  const results = found?.query === q ? found : undefined;

  return (
    <div className="flex flex-col gap-3">
      {teachers.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {[...teachers].map(([id, name]) => (
            <span
              key={id}
              className="bg-secondary flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs"
            >
              {name}
              <button
                type="button"
                aria-label={`${name} — olib tashlash`}
                className="hover:bg-background rounded-full p-0.5"
                onClick={() =>
                  onTeachersChange(togglePicked(teachers, { id, name }, false))
                }
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        type="search"
        placeholder="Region yoki o'qituvchi ismini qidirish"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {searching && (
        <div className="flex flex-col gap-2 rounded-md border px-3 py-2">
          <p className="text-muted-foreground text-xs font-medium">
            O&apos;qituvchilar
          </p>
          {!results ? (
            <p className="text-muted-foreground text-sm">Qidirilmoqda…</p>
          ) : results.teachers.length === 0 ? (
            <p className="text-muted-foreground text-sm">Topilmadi.</p>
          ) : (
            <>
              <TeacherList
                teachers={results.teachers.map((t) => ({
                  ...t,
                  hint: t.regions || "Regionsiz",
                }))}
                picked={teachers}
                onChange={onTeachersChange}
              />
              {results.more && (
                <p className="text-muted-foreground text-xs">
                  Hammasi ko&apos;rsatilmadi — ismni aniqroq yozing.
                </p>
              )}
            </>
          )}
        </div>
      )}
      {shownRows.length === 0 ? (
        !searching && (
          <p className="text-muted-foreground text-sm">Region topilmadi.</p>
        )
      ) : (
        <ul className="flex max-h-[50svh] flex-col divide-y overflow-y-auto rounded-md border">
          {shownRows.map((r) => {
            const open = expanded.has(r.id);
            const list = loaded[r.id];
            return (
              <li key={r.id} className="flex flex-col">
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-1 text-left text-sm font-medium"
                    onClick={() => void expand(r.id)}
                  >
                    <ChevronRightIcon
                      className={cn(
                        "size-4 shrink-0 transition-transform",
                        open && "rotate-90",
                      )}
                    />
                    <span className="truncate">{r.name}</span>
                    {r.own && (
                      <span className="text-muted-foreground shrink-0 text-xs font-normal">
                        (mening)
                      </span>
                    )}
                    <span className="text-muted-foreground ml-auto shrink-0 text-xs font-normal">
                      {r.teacherCount} o&apos;qit.
                    </span>
                  </button>
                  {r.own && (
                    <label className="flex shrink-0 items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        className="accent-primary size-4"
                        checked={regions.has(r.id)}
                        onChange={(e) =>
                          onRegionsChange(
                            toggle(regions, r.id, e.target.checked),
                          )
                        }
                      />
                      Butun region
                    </label>
                  )}
                </div>
                {open && (
                  <div className="bg-muted/40 px-3 py-2 pl-8">
                    {regions.has(r.id) && (
                      <p className="text-muted-foreground mb-2 text-xs">
                        Region tanlangan — undagi hamma o&apos;qituvchilar
                        ko&apos;radi.
                      </p>
                    )}
                    {list ? (
                      <TeacherList
                        teachers={list}
                        picked={teachers}
                        onChange={onTeachersChange}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Yuklanmoqda…
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Test egasi uchun: regionga yoki o'qituvchilarga ulashish (ular nusxa oladi) */
export function ShareTestButton({
  testId,
  options,
}: {
  testId: string;
  options: ShareOptions;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [regions, setRegions] = useState(new Set(options.regionIds));
  const [teachers, setTeachers] = useState<Picked>(
    new Map(options.teachers.map((t) => [t.id, t.name])),
  );
  const [error, setError] = useState<string>();
  const shared = options.regionIds.length + options.teachers.length;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Share2Icon />
        Ulashish{shared > 0 ? ` (${shared})` : ""}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Testni ulashish</DialogTitle>
            <DialogDescription>
              Regionni oching va undagi o&apos;qituvchilarni belgilang (istalgan
              regiondan) yoki o&apos;z regioningizni butunlay tanlang — ular
              testning o&apos;z nusxasini oladi. Sizning testingiz va natijalari
              o&apos;zgarmaydi, ularga ko&apos;rinmaydi.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await shareTestAction(testId, {
                  regionIds: [...regions],
                  teacherIds: [...teachers.keys()],
                });
                if (result.ok) {
                  toast.success(result.message);
                  setOpen(false);
                } else setError(result.error);
              });
            }}
          >
            <ShareTargetsPicker
              targets={options}
              regions={regions}
              teachers={teachers}
              onRegionsChange={setRegions}
              onTeachersChange={setTeachers}
            />
            <FormError message={error} />
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------- Ro'yxatda belgilab, bir yo'la ulashish ----------

type Selection = {
  /** Belgilash mumkin bo'lgan testlar — faqat o'qituvchining o'zinikilari */
  ids: readonly string[];
  selected: ReadonlySet<string>;
  setSelected: (next: Set<string>) => void;
};

const SelectionContext = createContext<Selection | null>(null);

function useSelection(): Selection {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("TestSelectionProvider kerak");
  return ctx;
}

export function TestSelectionProvider({
  ids,
  children,
}: {
  ids: readonly string[];
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  return (
    <SelectionContext value={{ ids, selected, setSelected }}>
      {children}
    </SelectionContext>
  );
}

export function SelectAllTestsCheckbox() {
  const { ids, selected, setSelected } = useSelection();
  const all = ids.length > 0 && selected.size === ids.length;
  return (
    <input
      type="checkbox"
      aria-label="Hammasini belgilash"
      className="accent-primary size-4"
      disabled={ids.length === 0}
      checked={all}
      ref={(el) => {
        if (el) el.indeterminate = selected.size > 0 && !all;
      }}
      onChange={() => setSelected(all ? new Set() : new Set(ids))}
    />
  );
}

export function SelectTestCheckbox({
  testId,
  title,
}: {
  testId: string;
  title: string;
}) {
  const { selected, setSelected } = useSelection();
  return (
    <input
      type="checkbox"
      aria-label={`${title} — belgilash`}
      className="accent-primary size-4"
      checked={selected.has(testId)}
      onChange={(e) => {
        const next = new Set(selected);
        if (e.target.checked) next.add(testId);
        else next.delete(testId);
        setSelected(next);
      }}
    />
  );
}

/** Belgilangan testlarni region yoki o'qituvchilarga ulashish (mavjudlari saqlanadi) */
export function BulkShareButton({ targets }: { targets: ShareTargets }) {
  const { selected, setSelected } = useSelection();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [teachers, setTeachers] = useState<Picked>(new Map());
  const [error, setError] = useState<string>();

  return (
    <>
      <Button
        variant="outline"
        disabled={selected.size === 0}
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
      >
        <Share2Icon />
        Tanlanganlarni ulashish
        {selected.size > 0 ? ` (${selected.size})` : ""}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected.size} ta testni ulashish</DialogTitle>
            <DialogDescription>
              Tanlanganlar har bir testning o&apos;z nusxasini oladi. Avval
              ulashilganlar saqlanadi — bu yerda faqat yangilari
              qo&apos;shiladi.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await shareTestsAction({
                  testIds: [...selected],
                  regionIds: [...regions],
                  teacherIds: [...teachers.keys()],
                });
                if (result.ok) {
                  toast.success(result.message);
                  setOpen(false);
                  setSelected(new Set());
                  setRegions(new Set());
                  setTeachers(new Map());
                } else setError(result.error);
              });
            }}
          >
            <ShareTargetsPicker
              targets={targets}
              regions={regions}
              teachers={teachers}
              onRegionsChange={setRegions}
              onTeachersChange={setTeachers}
            />
            <FormError message={error} />
            <DialogFooter>
              <Button
                type="submit"
                disabled={pending || regions.size + teachers.size === 0}
              >
                Ulashish
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Ulashilgan testdan o'z nusxasini olish (nusxa sahifasi ochiladi) */
export function CopySharedButton({ testId }: { testId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await copySharedTestAction(testId);
          if (result && !result.ok) toast.error(result.error);
        })
      }
    >
      <CopyIcon />
      Nusxa olish
    </Button>
  );
}
