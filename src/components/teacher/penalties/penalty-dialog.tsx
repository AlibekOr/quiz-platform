"use client";

import { useState, useTransition } from "react";
import { GavelIcon } from "lucide-react";
import { toast } from "sonner";
import { applyPenaltyAction } from "@/app/(teacher)/teacher/penalties/actions";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { formatPoints } from "@/lib/grades";
import type { PenaltyOption } from "@/lib/penalties";
import type { DateStr } from "@/lib/time";

/**
 * Jarima qo'yish: o'quvchilar tanlanadi, shablon tugmasi bosilganda darhol qo'llanadi
 * ("Darsga kechikish −1"). Izoh va ballni o'zgartirish ixtiyoriy
 */
export function PenaltyDialog({
  students,
  semesters,
  types,
  date,
  label = "Jarima",
  size = "sm",
}: {
  students: { id: string; fullName: string }[];
  /** Bittadan ko'p bo'lsa — tanlash ro'yxati chiqadi */
  semesters: { id: string; name: string }[];
  types: PenaltyOption[];
  /** Jarima sanasi (Toshkent kuni) */
  date: DateStr;
  label?: string;
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const single = students.length === 1;
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(single ? [students[0].id] : []),
  );
  const [semesterId, setSemesterId] = useState(semesters[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [points, setPoints] = useState("");
  const [error, setError] = useState<string>();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function apply(type: PenaltyOption) {
    setError(undefined);
    startTransition(async () => {
      const result = await applyPenaltyAction({
        semesterId,
        typeId: type.id,
        studentIds: [...selected],
        points: points.trim() ? Number(points.replace(",", ".")) : null,
        note,
        date,
      });
      if (result.ok) {
        toast.success(result.message);
        setOpen(false);
        setNote("");
        setPoints("");
        if (!single) setSelected(new Set());
      } else {
        setError(
          Object.values(result.fieldErrors ?? {}).flat()[0] ?? result.error,
        );
      }
    });
  }

  if (semesters.length === 0 || students.length === 0) return null;

  return (
    <>
      <Button size={size} variant="outline" onClick={() => setOpen(true)}>
        <GavelIcon />
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {single ? `Jarima: ${students[0].fullName}` : "Jarima qo'yish"}
            </DialogTitle>
            <DialogDescription>
              Shablonni bosing — tanlangan o&apos;quvchilarga darhol
              qo&apos;yiladi. Jarima semestr jamidan chegaradan keyin ayiriladi.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {semesters.length > 1 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="penalty-semester">Semestr</Label>
                <NativeSelect
                  id="penalty-semester"
                  value={semesterId}
                  onChange={(e) => setSemesterId(e.target.value)}
                >
                  {semesters.map((s) => (
                    <NativeSelectOption key={s.id} value={s.id}>
                      {s.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}

            {!single && (
              <fieldset
                className="flex flex-col gap-2"
                aria-label="O'quvchilar"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    O&apos;quvchilar ({selected.size})
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setSelected(
                        selected.size === students.length
                          ? new Set()
                          : new Set(students.map((s) => s.id)),
                      )
                    }
                  >
                    {selected.size === students.length
                      ? "Bekor qilish"
                      : "Hammasi"}
                  </Button>
                </div>
                <ul className="flex max-h-56 flex-col divide-y overflow-y-auto rounded-lg border">
                  {students.map((s) => (
                    <li key={s.id}>
                      <label className="flex items-center gap-2 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          className="accent-primary size-4"
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                        />
                        {s.fullName}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}

            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="penalty-note">Izoh (ixtiyoriy)</Label>
                <Input
                  id="penalty-note"
                  maxLength={300}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="penalty-points">Ball</Label>
                <Input
                  id="penalty-points"
                  type="number"
                  inputMode="decimal"
                  min={0.5}
                  step={0.5}
                  placeholder="shablon"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>
            </div>

            {types.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Faol shablon yo&apos;q. Sozlamalar → Jarima shablonlari.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {types.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    variant="outline"
                    disabled={pending || selected.size === 0}
                    onClick={() => apply(t)}
                    className="h-auto py-2 whitespace-normal"
                  >
                    {t.name}{" "}
                    <span className="text-destructive tabular-nums">
                      −{formatPoints(t.defaultPoints)}
                    </span>
                  </Button>
                ))}
              </div>
            )}
            <FormError message={error} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
