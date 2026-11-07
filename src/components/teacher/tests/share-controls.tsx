"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { ChevronRightIcon, CopyIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  copySharedTestAction,
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
import type { ShareTargets } from "@/lib/tests/sharing";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

export type ShareOptions = ShareTargets & {
  regionIds: string[];
  teacherIds: string[];
};

function toggle(set: ReadonlySet<string>, id: string, on: boolean) {
  const next = new Set(set);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

function TeacherList({
  teachers,
  selected,
  onChange,
}: {
  teachers: Option[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
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
            className="accent-primary size-4"
            checked={selected.has(t.id)}
            onChange={(e) => onChange(toggle(selected, t.id, e.target.checked))}
          />
          {t.name}
        </label>
      ))}
    </div>
  );
}

/**
 * Avval region, keyin undagi o'qituvchilar. Butun regionga yoki alohida o'qituvchilarga
 * (istalgan regiondan) ulashiladi
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
  teachers: ReadonlySet<string>;
  onRegionsChange: (next: Set<string>) => void;
  onTeachersChange: (next: Set<string>) => void;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const q = query.trim().toLowerCase();
  const groups = [
    ...targets.regions,
    ...(targets.unassigned.length > 0
      ? [
          {
            id: "",
            name: "Regionsiz",
            own: false,
            teachers: targets.unassigned,
          },
        ]
      : []),
  ]
    .map((r) => {
      const regionHit = q !== "" && r.name.toLowerCase().includes(q);
      const shown =
        q && !regionHit
          ? r.teachers.filter((t) => t.name.toLowerCase().includes(q))
          : r.teachers;
      return { ...r, shown, regionHit };
    })
    .filter((r) => !q || r.regionHit || r.shown.length > 0);

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        placeholder="Region yoki o'qituvchini qidirish"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">Hech narsa topilmadi.</p>
      ) : (
        <ul className="flex max-h-[50svh] flex-col divide-y overflow-y-auto rounded-md border">
          {groups.map((r) => {
            const open = q !== "" || expanded.has(r.id);
            const picked = r.teachers.filter((t) => teachers.has(t.id)).length;
            return (
              <li key={r.id || "none"} className="flex flex-col">
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-1 text-left text-sm font-medium"
                    onClick={() => setExpanded(toggle(expanded, r.id, !open))}
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
                      {picked > 0 ? `${picked}/` : ""}
                      {r.teachers.length} o&apos;qit.
                    </span>
                  </button>
                  {r.id && (
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
                    {r.id && regions.has(r.id) && (
                      <p className="text-muted-foreground mb-2 text-xs">
                        Region tanlangan — undagi hamma o&apos;qituvchilar
                        ko&apos;radi.
                      </p>
                    )}
                    <TeacherList
                      teachers={r.shown}
                      selected={teachers}
                      onChange={onTeachersChange}
                    />
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
  const [teachers, setTeachers] = useState(new Set(options.teacherIds));
  const [error, setError] = useState<string>();
  const shared = options.regionIds.length + options.teacherIds.length;

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
              Regionni oching va undagi o&apos;qituvchilarni belgilang (boshqa
              regionlardan ham) yoki butun regionni tanlang — ular testning
              o&apos;z nusxasini oladi. Sizning testingiz va natijalari
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
                  teacherIds: [...teachers],
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
  const [teachers, setTeachers] = useState<Set<string>>(new Set());
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
                  teacherIds: [...teachers],
                });
                if (result.ok) {
                  toast.success(result.message);
                  setOpen(false);
                  setSelected(new Set());
                  setRegions(new Set());
                  setTeachers(new Set());
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
