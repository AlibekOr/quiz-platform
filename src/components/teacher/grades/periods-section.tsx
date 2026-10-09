"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  createPeriod,
  deletePeriod,
  updatePeriod,
} from "@/app/(teacher)/teacher/grades/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate, type DateStr } from "@/lib/time";
import { periodSchema, type PeriodInput } from "@/lib/validators/grades";

export type PeriodRow = {
  id: string;
  name: string;
  startDate: DateStr;
  endDate: DateStr;
  passPercent: number;
  homeworkCount: number;
  testCount: number;
};

/** Guruh sahifasida: baholash davrlari ro'yxati, qo'shish, tahrirlash va o'chirish */
export function PeriodsSection({
  groupId,
  periods,
}: {
  groupId: string;
  periods: PeriodRow[];
}) {
  const [editing, setEditing] = useState<PeriodRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<PeriodRow | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Baholash davrlari</h2>
        <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
          <PlusIcon />
          Davr qo&apos;shish
        </Button>
      </div>
      {periods.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Davr yo&apos;q. Uyga vazifa va baholar uchun avval davr qo&apos;shing
          (masalan, &quot;Oktyabr&quot; yoki &quot;1-modul&quot;).
        </p>
      ) : (
        <ul className="flex flex-col divide-y text-sm">
          {periods.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDate(p.startDate)} – {formatDate(p.endDate)} ·
                  o&apos;tish {p.passPercent}% · {p.homeworkCount} ta vazifa,{" "}
                  {p.testCount} ta test
                </span>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${p.name}: tahrirlash`}
                  onClick={() => setEditing(p)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${p.name}: o'chirish`}
                  onClick={() => setDeleting(p)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Yangi davr" : "Davrni tahrirlash"}
            </DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <PeriodForm
              groupId={groupId}
              period={editing === "new" ? null : editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {deleting && (
        <ConfirmAction
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Davrni o'chirish"
          description={`"${deleting.name}" davri bilan birga uning ${deleting.homeworkCount} ta vazifasi, qo'yilgan ballar va tuzatishlar o'chadi. Testlar o'chmaydi, faqat davrdan ajraladi.`}
          confirmLabel="O'chirish"
          destructive
          action={() => deletePeriod(deleting.id)}
        />
      )}
    </div>
  );
}

function PeriodForm({
  groupId,
  period,
  onDone,
}: {
  groupId: string;
  period: PeriodRow | null;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaultValues: PeriodInput = period
    ? {
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        passPercent: period.passPercent,
      }
    : { name: "", startDate: "", endDate: "", passPercent: 60 };
  const form = useForm({ resolver: zodResolver(periodSchema), defaultValues });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = period
        ? await updatePeriod(period.id, values)
        : await createPeriod(groupId, values);
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
      <FormField id="period-name" label="Nomi" error={errors.name?.message}>
        <Input
          id="period-name"
          maxLength={60}
          placeholder="Oktyabr"
          aria-invalid={!!errors.name}
          {...form.register("name")}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="period-start"
          label="Boshlanishi"
          error={errors.startDate?.message}
        >
          <Input
            id="period-start"
            type="date"
            aria-invalid={!!errors.startDate}
            {...form.register("startDate")}
          />
        </FormField>
        <FormField
          id="period-end"
          label="Tugashi"
          error={errors.endDate?.message}
        >
          <Input
            id="period-end"
            type="date"
            aria-invalid={!!errors.endDate}
            {...form.register("endDate")}
          />
        </FormField>
      </div>
      <FormField
        id="period-pass"
        label="O'tish chegarasi (%)"
        error={errors.passPercent?.message}
      >
        <Input
          id="period-pass"
          type="number"
          min={1}
          max={100}
          className="w-28"
          aria-invalid={!!errors.passPercent}
          {...form.register("passPercent", { valueAsNumber: true })}
        />
      </FormField>
      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
