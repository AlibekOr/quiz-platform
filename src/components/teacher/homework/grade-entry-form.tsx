"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { saveAssignmentGrades } from "@/app/(teacher)/teacher/homework/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AssignmentCategory } from "@/lib/grades";
import { cn } from "@/lib/utils";
import type { AssignmentGradesInput } from "@/lib/validators/grades";

export type GradeEntryRow = {
  studentId: string;
  fullName: string;
  /** "o'tkazilgan: ..." kabi belgi */
  label: string | null;
  points: number | null;
  note: string | null;
  /** Ball qo'yib bo'lmaydi (EXTRA: holati mos emas) — sababi */
  blocked: string | null;
};

const HOMEWORK_POINTS = [
  { value: "0", label: "0" },
  { value: "0.5", label: "0,5" },
  { value: "1", label: "1" },
] as const;

/**
 * Ball qo'yish ro'yxati: telefonda bir ustunli. Uyga vazifa — 0 / 0,5 / 1 tugmalari
 * (qayta bosilsa olib tashlanadi), qolganlari — 0..maxPoints, 0,5 qadam. Qiymatlar serverda
 * kategoriya bo'yicha tekshiriladi
 */
export function GradeEntryForm({
  assignmentId,
  category,
  maxPoints,
  rows,
}: {
  assignmentId: string;
  category: AssignmentCategory;
  maxPoints: number;
  rows: GradeEntryRow[];
}) {
  const [pending, startTransition] = useTransition();
  const editable = rows.filter((r) => r.blocked === null);
  const defaultValues: AssignmentGradesInput = {
    grades: editable.map((r) => ({
      studentId: r.studentId,
      points: r.points === null ? "" : String(r.points),
      note: r.note ?? "",
    })),
  };
  const form = useForm<AssignmentGradesInput>({ defaultValues });
  const grades = useWatch({ control: form.control, name: "grades" });
  const { errors, isDirty } = form.formState;
  const index = new Map(editable.map((r, i) => [r.studentId, i]));
  const graded = grades.filter((g) => g.points !== "").length;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveAssignmentGrades(assignmentId, values);
      if (result.ok) {
        toast.success(result.message);
        form.reset(values);
      } else {
        applyServerErrors(form, result);
        toast.error(result.error);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <ul className="divide-y rounded-lg border">
        {rows.map((r) => {
          const i = index.get(r.studentId);
          return (
            <li
              key={r.studentId}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{r.fullName}</span>
                {r.label && (
                  <span className="text-muted-foreground text-xs italic">
                    {r.label}
                  </span>
                )}
              </div>
              {i === undefined ? (
                <Badge variant="outline">{r.blocked}</Badge>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {category === "HOMEWORK" ? (
                    <div
                      role="radiogroup"
                      aria-label={`${r.fullName}: ball`}
                      className="flex gap-1"
                    >
                      {HOMEWORK_POINTS.map((p) => {
                        const checked = grades[i]?.points === p.value;
                        return (
                          <button
                            key={p.value}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            onClick={() =>
                              form.setValue(
                                `grades.${i}.points`,
                                checked ? "" : p.value,
                                { shouldDirty: true },
                              )
                            }
                            className={cn(
                              "hover:bg-muted h-10 w-12 rounded-md border text-sm font-medium tabular-nums transition-colors",
                              checked &&
                                "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                            )}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={maxPoints}
                        step={0.5}
                        className="w-20 text-right tabular-nums"
                        aria-label={`${r.fullName}: ball`}
                        {...form.register(`grades.${i}.points`)}
                      />
                      <span className="text-muted-foreground text-sm">
                        /{maxPoints}
                      </span>
                    </div>
                  )}
                  <Input
                    placeholder="Izoh"
                    maxLength={300}
                    className="min-w-0 flex-1 sm:w-56"
                    aria-label={`${r.fullName}: izoh`}
                    {...form.register(`grades.${i}.note`)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <FormError message={errors.root?.server?.message} />
      <div className="bg-background sticky bottom-0 flex items-center justify-between gap-3 border-t py-3">
        <span className="text-muted-foreground text-sm">
          Baholangan: {graded} / {editable.length}
        </span>
        <Button type="submit" disabled={pending || !isDirty}>
          Ballarni saqlash
        </Button>
      </div>
    </form>
  );
}
