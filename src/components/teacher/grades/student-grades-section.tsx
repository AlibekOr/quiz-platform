"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  addExemption,
  addPointAdjustment,
  deleteExemption,
  deletePointAdjustment,
} from "@/app/(teacher)/teacher/grades/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
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
import { formatPoints, signedPoints } from "@/lib/grades";
import {
  adjustmentSchema,
  exemptionSchema,
  type AdjustmentInput,
  type ExemptionInput,
} from "@/lib/validators/grades";

export type StudentPeriodSummary = {
  id: string;
  name: string;
  groupName: string;
  total: number;
  max: number;
  percent: number | null;
  passed: boolean | null;
};

type Option = { value: string; label: string };

type Removing = {
  kind: "adjustment" | "exemption";
  id: string;
  label: string;
};

/** O'quvchi kartochkasi: davrlar bo'yicha natija, ball tuzatishlari va ozod qilishlar */
export function StudentGradesSection({
  studentId,
  periods,
  items,
  adjustments,
  exemptions,
  archived,
}: {
  studentId: string;
  periods: StudentPeriodSummary[];
  /** Ozod qilish uchun: itemKey -> "Davr · Vazifa: nomi" */
  items: Option[];
  adjustments: {
    id: string;
    periodName: string;
    points: number;
    reason: string;
  }[];
  exemptions: { id: string; label: string; reason: string }[];
  archived: boolean;
}) {
  const [dialog, setDialog] = useState<"adjust" | "exempt" | null>(null);
  const [removing, setRemoving] = useState<Removing | null>(null);
  const closeDialog = (open: boolean) => !open && setDialog(null);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Baholar</h2>
        {!archived && periods.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialog("adjust")}
            >
              Ball tuzatish
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDialog("exempt")}
              disabled={items.length === 0}
            >
              Ozod qilish
            </Button>
          </div>
        )}
      </div>

      {periods.length === 0 ? (
        <p className="text-muted-foreground">
          O&apos;quvchi guruhlarida baholash davri yo&apos;q.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border text-sm">
          {periods.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3"
            >
              <span>
                <span className="font-medium">{p.name}</span>{" "}
                <span className="text-muted-foreground">· {p.groupName}</span>
              </span>
              <span className="flex items-center gap-2 tabular-nums">
                {formatPoints(p.total)}/{formatPoints(p.max)}
                {p.percent !== null && ` · ${p.percent}%`}
                {p.passed === null ? null : p.passed ? (
                  <Badge variant="secondary">O&apos;tdi</Badge>
                ) : (
                  <Badge variant="destructive">O&apos;tmadi</Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {(adjustments.length > 0 || exemptions.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {adjustments.length > 0 && (
            <ItemList
              title="Ball tuzatishlari"
              rows={adjustments.map((a) => ({
                id: a.id,
                main: `${signedPoints(a.points)} · ${a.periodName}`,
                sub: a.reason,
              }))}
              onRemove={(r) =>
                setRemoving({ kind: "adjustment", id: r.id, label: r.main })
              }
              disabled={archived}
            />
          )}
          {exemptions.length > 0 && (
            <ItemList
              title="Ozod qilingan"
              rows={exemptions.map((e) => ({
                id: e.id,
                main: e.label,
                sub: e.reason,
              }))}
              onRemove={(r) =>
                setRemoving({ kind: "exemption", id: r.id, label: r.main })
              }
              disabled={archived}
            />
          )}
        </div>
      )}

      <Dialog open={dialog === "adjust"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ball tuzatish</DialogTitle>
            <DialogDescription>
              Davr jamiga qo&apos;shiladi (manfiy bo&apos;lsa ayiriladi). Jami 0
              dan kam va maksimaldan ko&apos;p bo&apos;lmaydi.
            </DialogDescription>
          </DialogHeader>
          <AdjustmentForm
            studentId={studentId}
            periods={periods.map((p) => ({
              value: p.id,
              label: `${p.name} · ${p.groupName}`,
            }))}
            onDone={() => setDialog(null)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "exempt"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ozod qilish</DialogTitle>
            <DialogDescription>
              Ozod qilingan vazifa yoki test o&apos;quvchining jami va maksimal
              balidan chiqariladi.
            </DialogDescription>
          </DialogHeader>
          <ExemptionForm
            studentId={studentId}
            items={items}
            onDone={() => setDialog(null)}
          />
        </DialogContent>
      </Dialog>

      {removing && (
        <ConfirmAction
          open
          onOpenChange={(o) => !o && setRemoving(null)}
          title={
            removing.kind === "adjustment"
              ? "Tuzatishni o'chirish"
              : "Ozod qilishni bekor qilish"
          }
          description={removing.label}
          confirmLabel={
            removing.kind === "adjustment" ? "O'chirish" : "Bekor qilish"
          }
          destructive
          action={() =>
            removing.kind === "adjustment"
              ? deletePointAdjustment(removing.id)
              : deleteExemption(removing.id)
          }
        />
      )}
    </section>
  );
}

function ItemList({
  title,
  rows,
  onRemove,
  disabled,
}: {
  title: string;
  rows: { id: string; main: string; sub: string }[];
  onRemove: (row: { id: string; main: string }) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
      <h3 className="font-medium">{title}</h3>
      <ul className="flex flex-col divide-y">
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex items-start justify-between gap-2 py-1.5"
          >
            <span className="min-w-0">
              <span className="block">{r.main}</span>
              <span className="text-muted-foreground block text-xs">
                {r.sub}
              </span>
            </span>
            {!disabled && (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`${r.main}: o'chirish`}
                onClick={() => onRemove(r)}
              >
                <Trash2Icon />
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdjustmentForm({
  studentId,
  periods,
  onDone,
}: {
  studentId: string;
  periods: Option[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaultValues: AdjustmentInput = {
    periodId: periods[0]?.value ?? "",
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
      <FormField id="adj-period" label="Davr" error={errors.periodId?.message}>
        <NativeSelect id="adj-period" {...form.register("periodId")}>
          {periods.map((p) => (
            <NativeSelectOption key={p.value} value={p.value}>
              {p.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField
        id="adj-points"
        label="Ball (masalan, 5 yoki -3)"
        error={errors.points?.message}
      >
        <Input
          id="adj-points"
          type="number"
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

function ExemptionForm({
  studentId,
  items,
  onDone,
}: {
  studentId: string;
  items: Option[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaultValues: ExemptionInput = { item: "", reason: "" };
  const form = useForm({
    resolver: zodResolver(exemptionSchema),
    defaultValues,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await addExemption(studentId, values);
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
        id="ex-item"
        label="Vazifa yoki test"
        error={errors.item?.message}
      >
        <NativeSelect
          id="ex-item"
          aria-invalid={!!errors.item}
          {...form.register("item")}
        >
          <NativeSelectOption value="" disabled>
            Tanlang
          </NativeSelectOption>
          {items.map((i) => (
            <NativeSelectOption key={i.value} value={i.value}>
              {i.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField id="ex-reason" label="Sabab" error={errors.reason?.message}>
        <Input
          id="ex-reason"
          maxLength={300}
          aria-invalid={!!errors.reason}
          {...form.register("reason")}
        />
      </FormField>
      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Ozod qilish
        </Button>
      </DialogFooter>
    </form>
  );
}
