"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  addPointAdjustment,
  deletePointAdjustment,
} from "@/app/(teacher)/teacher/grades/actions";
import { deletePenalty } from "@/app/(teacher)/teacher/penalties/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { StatusBadge } from "@/components/grades/status-badge";
import { PenaltyDialog } from "@/components/teacher/penalties/penalty-dialog";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { formatPoints, signedPoints, type SemesterStatus } from "@/lib/grades";
import type { PenaltyOption } from "@/lib/penalties";
import { formatDate, type DateStr } from "@/lib/time";
import {
  adjustmentSchema,
  type AdjustmentInput,
} from "@/lib/validators/grades";

export type StudentSemesterSummary = {
  id: string;
  name: string;
  groupName: string;
  total: number;
  maxTotal: number;
  status: SemesterStatus;
  adjustments: { id: string; points: number; reason: string }[];
  penalties: {
    id: string;
    points: number;
    name: string;
    note: string | null;
    date: DateStr;
    /** Avtomatik (uyga vazifaga 0, sababsiz kelmagan) — bekor qilinmaydi */
    auto: boolean;
  }[];
};

/** O'quvchi kartochkasi: semestrlar bo'yicha natija va ball tuzatishlari */
export function StudentGradesSection({
  studentId,
  fullName,
  semesters,
  penaltyTypes,
  today,
  archived,
}: {
  studentId: string;
  fullName: string;
  semesters: StudentSemesterSummary[];
  penaltyTypes: PenaltyOption[];
  today: DateStr;
  archived: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<{
    kind: "adjustment" | "penalty";
    id: string;
    label: string;
  } | null>(null);
  const penalties = semesters.flatMap((s) =>
    s.penalties.map((p) => ({ ...p, semesterName: s.name })),
  );
  const adjustments = semesters.flatMap((s) =>
    s.adjustments.map((a) => ({ ...a, semesterName: s.name })),
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Semestr ballari</h2>
        {!archived && semesters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <PenaltyDialog
              students={[{ id: studentId, fullName }]}
              semesters={semesters.map((s) => ({
                id: s.id,
                name: `${s.name} · ${s.groupName}`,
              }))}
              types={penaltyTypes}
              date={today}
            />
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              Ball tuzatish
            </Button>
          </div>
        )}
      </div>

      {semesters.length === 0 ? (
        <p className="text-muted-foreground">
          O&apos;quvchi guruhlarida semestr yo&apos;q.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border text-sm">
          {semesters.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3"
            >
              <span>
                <span className="font-medium">{s.name}</span>{" "}
                <span className="text-muted-foreground">· {s.groupName}</span>
              </span>
              <span className="flex items-center gap-2 tabular-nums">
                {formatPoints(s.total)}/{s.maxTotal}
                <StatusBadge status={s.status} />
              </span>
            </li>
          ))}
        </ul>
      )}

      {adjustments.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
          <h3 className="font-medium">Ball tuzatishlari</h3>
          <ul className="flex flex-col divide-y">
            {adjustments.map((a) => {
              const label = `${signedPoints(a.points)} · ${a.semesterName}`;
              return (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-2 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="block">{label}</span>
                    <span className="text-muted-foreground block text-xs">
                      {a.reason}
                    </span>
                  </span>
                  {!archived && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`${label}: o'chirish`}
                      onClick={() =>
                        setRemoving({ kind: "adjustment", id: a.id, label })
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {penalties.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
          <h3 className="font-medium">Jarimalar</h3>
          <ul className="flex flex-col divide-y">
            {penalties.map((p) => {
              const label = `−${formatPoints(p.points)} · ${p.name}`;
              return (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-2 py-1.5"
                >
                  <span className="min-w-0">
                    <span className="text-destructive block">{label}</span>
                    <span className="text-muted-foreground block text-xs">
                      {formatDate(p.date)} · {p.semesterName}
                      {p.note && ` · ${p.note}`}
                      {p.auto && " · avtomatik"}
                    </span>
                  </span>
                  {!archived && !p.auto && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`${label}: bekor qilish`}
                      onClick={() =>
                        setRemoving({ kind: "penalty", id: p.id, label })
                      }
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ball tuzatish</DialogTitle>
            <DialogDescription>
              Semestr baliga qo&apos;shiladi (manfiy bo&apos;lsa ayiriladi),
              masalan boshqa guruhdan o&apos;tkazilgan o&apos;quvchining
              ballari. Jami 0 dan kam va chegaradan ko&apos;p bo&apos;lmaydi.
            </DialogDescription>
          </DialogHeader>
          <AdjustmentForm
            studentId={studentId}
            semesters={semesters.map((s) => ({
              value: s.id,
              label: `${s.name} · ${s.groupName}`,
            }))}
            onDone={() => setAdding(false)}
          />
        </DialogContent>
      </Dialog>

      {removing && (
        <ConfirmAction
          open
          onOpenChange={(o) => !o && setRemoving(null)}
          title={
            removing.kind === "penalty"
              ? "Jarimani bekor qilish"
              : "Tuzatishni o'chirish"
          }
          description={removing.label}
          confirmLabel={
            removing.kind === "penalty" ? "Bekor qilish" : "O'chirish"
          }
          destructive
          action={() =>
            removing.kind === "penalty"
              ? deletePenalty(removing.id)
              : deletePointAdjustment(removing.id)
          }
        />
      )}
    </section>
  );
}

function AdjustmentForm({
  studentId,
  semesters,
  onDone,
}: {
  studentId: string;
  semesters: { value: string; label: string }[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaultValues: AdjustmentInput = {
    semesterId: semesters[0]?.value ?? "",
    points: 1,
    reason: "",
  };
  const form = useForm({
    resolver: zodResolver(adjustmentSchema),
    defaultValues,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await addPointAdjustment(studentId, values);
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField
        id="adj-semester"
        label="Semestr"
        error={errors.semesterId?.message}
      >
        <NativeSelect id="adj-semester" {...form.register("semesterId")}>
          {semesters.map((s) => (
            <NativeSelectOption key={s.value} value={s.value}>
              {s.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField
        id="adj-points"
        label="Ball (masalan, 5, 2.5 yoki -3)"
        error={errors.points?.message}
      >
        <Input
          id="adj-points"
          type="number"
          step={0.5}
          className="w-28"
          aria-invalid={!!errors.points}
          {...form.register("points", { valueAsNumber: true })}
        />
      </FormField>
      <FormField id="adj-reason" label="Sabab" error={errors.reason?.message}>
        <Input
          id="adj-reason"
          maxLength={300}
          aria-invalid={!!errors.reason}
          {...form.register("reason")}
        />
      </FormField>
      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Qo&apos;shish
        </Button>
      </DialogFooter>
    </form>
  );
}
