"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { saveAssignmentGrades } from "@/app/(teacher)/teacher/homework/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPoints } from "@/lib/grades";
import { cn } from "@/lib/utils";
import type { AssignmentGradesInput } from "@/lib/validators/grades";

export type GradeEntryRow = {
  studentId: string;
  fullName: string;
  /** "o'tkazilgan: ..." kabi belgi */
  label: string | null;
  points: number | null;
  note: string | null;
};

/**
 * Ball qo'yish ro'yxati: telefonda bir ustunli. Qiymatlar kam bo'lsa (masalan, uyga vazifa
 * 0 / 0,5 / 1) — tugmalar (qayta bosilsa olib tashlanadi), aks holda son maydoni. Oraliq va
 * qadam semestr kategoriyasidan; qiymatlar serverda ham tekshiriladi
 */
export function GradeEntryForm({
  assignmentId,
  choices,
  min,
  maxPoints,
  step,
  rows,
}: {
  assignmentId: string;
  /** Tugmalar uchun qiymatlar (lib/grades.ts pointChoices); null — son maydoni */
  choices: number[] | null;
  min: number;
  maxPoints: number;
  step: number;
  rows: GradeEntryRow[];
}) {
  const [pending, startTransition] = useTransition();
  const defaultValues: AssignmentGradesInput = {
    grades: rows.map((r) => ({
      studentId: r.studentId,
      points: r.points === null ? "" : String(r.points),
      note: r.note ?? "",
    })),
  };
  const form = useForm<AssignmentGradesInput>({ defaultValues });
  const grades = useWatch({ control: form.control, name: "grades" });
  const { errors, isDirty } = form.formState;
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
        {rows.map((r, i) => (
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
            <div className="flex flex-wrap gap-2">
              {choices ? (
                <div
                  role="radiogroup"
                  aria-label={`${r.fullName}: ball`}
                  className="flex gap-1"
                >
                  {choices.map((value) => {
                    const text = String(value);
                    const checked = grades[i]?.points === text;
                    return (
                      <button
                        key={text}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() =>
                          form.setValue(
                            `grades.${i}.points`,
                            checked ? "" : text,
                            { shouldDirty: true },
                          )
                        }
                        className={cn(
                          "hover:bg-muted h-10 w-12 rounded-md border text-sm font-medium tabular-nums transition-colors",
                          checked &&
                            "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                        )}
                      >
                        {formatPoints(value)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={min}
                    max={maxPoints}
                    step={step}
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
          </li>
        ))}
      </ul>
      <FormError message={errors.root?.server?.message} />
      <div className="bg-background sticky bottom-0 flex items-center justify-between gap-3 border-t py-3">
        <span className="text-muted-foreground text-sm">
          Baholangan: {graded} / {rows.length}
        </span>
        <Button type="submit" disabled={pending || !isDirty}>
          Ballarni saqlash
        </Button>
      </div>
    </form>
  );
}
