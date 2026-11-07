"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { CopyIcon, Share2Icon } from "lucide-react";
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

type Option = { id: string; name: string };

export type ShareOptions = {
  regions: Option[];
  teachers: Option[];
  regionIds: string[];
  teacherIds: string[];
};

function Checklist({
  title,
  items,
  selected,
  onChange,
}: {
  title: string;
  items: Option[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{title}</legend>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Yo&apos;q.</p>
      ) : (
        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {items.map((item) => (
            <label key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-primary size-4"
                checked={selected.has(item.id)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(item.id);
                  else next.delete(item.id);
                  onChange(next);
                }}
              />
              {item.name}
            </label>
          ))}
        </div>
      )}
    </fieldset>
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
              Tanlangan region o&apos;qituvchilari yoki tanlangan
              o&apos;qituvchilar testning o&apos;z nusxasini oladi. Sizning
              testingiz va natijalari o&apos;zgarmaydi, ularga ko&apos;rinmaydi.
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
            <Checklist
              title="Regionlarim"
              items={options.regions}
              selected={regions}
              onChange={setRegions}
            />
            <Checklist
              title="O'qituvchilar"
              items={options.teachers}
              selected={teachers}
              onChange={setTeachers}
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
export function BulkShareButton({
  targets,
}: {
  targets: { regions: Option[]; teachers: Option[] };
}) {
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
            <Checklist
              title="Regionlarim"
              items={targets.regions}
              selected={regions}
              onChange={setRegions}
            />
            <Checklist
              title="O'qituvchilar"
              items={targets.teachers}
              selected={teachers}
              onChange={setTeachers}
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
