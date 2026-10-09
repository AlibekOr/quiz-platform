"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveTestGrading } from "@/app/(teacher)/teacher/grades/actions";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DateStr } from "@/lib/time";

export type GradingGroup = {
  id: string;
  name: string;
  periods: { id: string; name: string; points: number | null }[];
};

type Row = { enabled: boolean; points: string };

/**
 * Test muddati va guruh davrlariga biriktirish. Test faqat o'zi biriktirilgan guruhlarning
 * davrlariga qo'shiladi; o'quvchi bali = birinchi urinish foizi × davrdagi bal.
 */
export function TestGradingForm({
  testId,
  dueDate,
  groups,
}: {
  testId: string;
  dueDate: DateStr | null;
  groups: GradingGroup[];
}) {
  const [pending, startTransition] = useTransition();
  const [due, setDue] = useState(dueDate ?? "");
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      groups.flatMap((g) =>
        g.periods.map((p) => [
          p.id,
          { enabled: p.points !== null, points: String(p.points ?? 10) },
        ]),
      ),
    ),
  );
  const [error, setError] = useState<string>();

  function patch(periodId: string, value: Partial<Row>) {
    setRows((prev) => ({
      ...prev,
      [periodId]: { ...prev[periodId], ...value },
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const links = Object.entries(rows)
      .filter(([, r]) => r.enabled)
      .map(([periodId, r]) => ({ periodId, points: Number(r.points) }));
    if (links.some((l) => !Number.isInteger(l.points) || l.points < 1)) {
      setError("Bal 1 dan katta butun son bo'lsin");
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await saveTestGrading(testId, { dueDate: due, links });
      if (result.ok) toast.success(result.message);
      else
        setError(
          Object.values(result.fieldErrors ?? {}).flat()[0] ?? result.error,
        );
    });
  }

  const anyPeriods = groups.some((g) => g.periods.length > 0);

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-lg border p-4"
      noValidate
    >
      <h2 className="font-semibold">Baholash</h2>
      <FormField id="test-due" label="Muddat (ixtiyoriy)">
        <Input
          id="test-due"
          type="date"
          className="w-44"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
      </FormField>
      <p className="text-muted-foreground -mt-2 text-xs">
        Muddat kuni tugagach testni ishlamagan o&apos;quvchiga baholarda 0
        hisoblanadi. Muddatsiz test faqat ishlanganda hisobga kiradi.
      </p>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-medium">
          Davrlarga biriktirish
        </legend>
        {groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Avval yuqorida testni guruhga biriktiring.
          </p>
        ) : !anyPeriods ? (
          <p className="text-muted-foreground text-sm">
            Test guruhlarida baholash davri yo&apos;q. Davrni guruh sahifasida
            qo&apos;shing.
          </p>
        ) : (
          groups.map((g) => (
            <div key={g.id} className="flex flex-col gap-2">
              <span className="text-sm font-medium">{g.name}</span>
              {g.periods.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  Davr yo&apos;q
                </span>
              ) : (
                g.periods.map((p) => {
                  const row = rows[p.id];
                  return (
                    <div key={p.id} className="flex items-center gap-3 pl-2">
                      <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="accent-primary size-4"
                          checked={row.enabled}
                          onChange={(e) =>
                            patch(p.id, { enabled: e.target.checked })
                          }
                        />
                        {p.name}
                      </label>
                      {row.enabled && (
                        <label className="flex items-center gap-1 text-sm">
                          <Input
                            type="number"
                            min={1}
                            max={1000}
                            className="w-20 text-right"
                            aria-label={`${g.name}, ${p.name}: bal`}
                            value={row.points}
                            onChange={(e) =>
                              patch(p.id, { points: e.target.value })
                            }
                          />
                          ball
                        </label>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ))
        )}
      </fieldset>

      <FormError message={error} />
      <div>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </div>
    </form>
  );
}
