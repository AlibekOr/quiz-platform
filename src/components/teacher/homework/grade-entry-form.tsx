"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saveHomeworkGrades } from "@/app/(teacher)/teacher/homework/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  homeworkGradesSchema,
  type HomeworkGradesInput,
} from "@/lib/validators/grades";

export type GradeEntryRow = {
  studentId: string;
  fullName: string;
  /** "o'tkazilgan: ..." kabi belgi */
  label: string | null;
  points: number | null;
  note: string | null;
  /** Ozod qilingan bo'lsa — sabab; ball qo'yilmaydi */
  exempt: string | null;
};

/** Ball qo'yish ro'yxati: telefonda bir ustunli, bo'sh qoldirilgan ball — baholanmagan */
export function GradeEntryForm({
  homeworkId,
  maxPoints,
  rows,
}: {
  homeworkId: string;
  maxPoints: number;
  rows: GradeEntryRow[];
}) {
  const [pending, startTransition] = useTransition();
  const editable = rows.filter((r) => r.exempt === null);
  const defaultValues: HomeworkGradesInput = {
    grades: editable.map((r) => ({
      studentId: r.studentId,
      points: r.points === null ? "" : String(r.points),
      note: r.note ?? "",
    })),
  };
  const form = useForm({
    resolver: zodResolver(homeworkGradesSchema),
    defaultValues,
  });
  const { errors, isDirty } = form.formState;
  const index = new Map(editable.map((r, i) => [r.studentId, i]));
  const firstRowError = errors.grades?.find?.((g) => g?.points)?.points;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveHomeworkGrades(homeworkId, values);
      if (result.ok) {
        toast.success(result.message);
        form.reset(form.getValues());
      } else {
        applyServerErrors(form, result);
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
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">Ozod</Badge>
                  <span className="text-muted-foreground">{r.exempt}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={maxPoints}
                      className="w-20 text-right tabular-nums"
                      aria-label={`${r.fullName}: ball`}
                      aria-invalid={!!errors.grades?.[i]?.points}
                      {...form.register(`grades.${i}.points`)}
                    />
                    <span className="text-muted-foreground text-sm">
                      /{maxPoints}
                    </span>
                  </div>
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
      <FormError
        message={firstRowError?.message ?? errors.root?.server?.message}
      />
      <div className="bg-background sticky bottom-0 border-t py-3">
        <Button type="submit" disabled={pending || !isDirty}>
          Ballarni saqlash
        </Button>
      </div>
    </form>
  );
}
