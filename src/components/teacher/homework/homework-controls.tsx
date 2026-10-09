"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createHomework,
  deleteHomework,
  updateHomework,
} from "@/app/(teacher)/teacher/homework/actions";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { DateStr } from "@/lib/time";
import { homeworkSchema, type HomeworkInput } from "@/lib/validators/grades";

export type PeriodOption = { id: string; name: string };

export type HomeworkRow = {
  id: string;
  periodId: string;
  title: string;
  description: string | null;
  dueDate: DateStr;
  maxPoints: number;
};

export function AddHomeworkButton({
  periods,
  defaultPeriodId,
}: {
  periods: PeriodOption[];
  defaultPeriodId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={periods.length === 0}>
        <PlusIcon />
        Vazifa qo&apos;shish
      </Button>
      <HomeworkDialog
        open={open}
        onOpenChange={setOpen}
        periods={periods}
        homework={null}
        defaultPeriodId={defaultPeriodId}
      />
    </>
  );
}

export function HomeworkRowActions({
  homework,
  periods,
}: {
  homework: HomeworkRow;
  periods: PeriodOption[];
}) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const close = (open: boolean) => !open && setDialog(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${homework.title}: amallar`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialog("delete")}
          >
            O&apos;chirish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <HomeworkDialog
        open={dialog === "edit"}
        onOpenChange={close}
        periods={periods}
        homework={homework}
      />
      <ConfirmAction
        open={dialog === "delete"}
        onOpenChange={close}
        title="Vazifani o'chirish"
        description={`"${homework.title}" va unga qo'yilgan barcha ballar o'chadi.`}
        confirmLabel="O'chirish"
        destructive
        action={() => deleteHomework(homework.id)}
      />
    </>
  );
}

function HomeworkDialog({
  open,
  onOpenChange,
  periods,
  homework,
  defaultPeriodId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periods: PeriodOption[];
  homework: HomeworkRow | null;
  defaultPeriodId?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {homework ? "Vazifani tahrirlash" : "Yangi uyga vazifa"}
          </DialogTitle>
        </DialogHeader>
        <HomeworkForm
          periods={periods}
          homework={homework}
          defaultPeriodId={defaultPeriodId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function HomeworkForm({
  periods,
  homework,
  defaultPeriodId,
  onDone,
}: {
  periods: PeriodOption[];
  homework: HomeworkRow | null;
  defaultPeriodId?: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaultValues: HomeworkInput = homework
    ? {
        periodId: homework.periodId,
        title: homework.title,
        description: homework.description ?? "",
        dueDate: homework.dueDate,
        maxPoints: homework.maxPoints,
      }
    : {
        periodId: defaultPeriodId ?? periods[0]?.id ?? "",
        title: "",
        description: "",
        dueDate: "",
        maxPoints: 10,
      };
  const form = useForm({
    resolver: zodResolver(homeworkSchema),
    defaultValues,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = homework
        ? await updateHomework(homework.id, values)
        : await createHomework(values);
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
      <FormField id="hw-period" label="Davr" error={errors.periodId?.message}>
        <NativeSelect
          id="hw-period"
          aria-invalid={!!errors.periodId}
          {...form.register("periodId")}
        >
          <NativeSelectOption value="" disabled>
            Davrni tanlang
          </NativeSelectOption>
          {periods.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField id="hw-title" label="Nomi" error={errors.title?.message}>
        <Input
          id="hw-title"
          maxLength={200}
          aria-invalid={!!errors.title}
          {...form.register("title")}
        />
      </FormField>
      <FormField
        id="hw-description"
        label="Izoh (ixtiyoriy)"
        error={errors.description?.message}
      >
        <Textarea
          id="hw-description"
          rows={3}
          maxLength={2000}
          {...form.register("description")}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField id="hw-due" label="Muddat" error={errors.dueDate?.message}>
          <Input
            id="hw-due"
            type="date"
            aria-invalid={!!errors.dueDate}
            {...form.register("dueDate")}
          />
        </FormField>
        <FormField
          id="hw-max"
          label="Maksimal ball"
          error={errors.maxPoints?.message}
        >
          <Input
            id="hw-max"
            type="number"
            min={1}
            max={1000}
            aria-invalid={!!errors.maxPoints}
            {...form.register("maxPoints", { valueAsNumber: true })}
          />
        </FormField>
      </div>
      <p className="text-muted-foreground text-xs">
        Muddat kuni tugagach ball qo&apos;yilmagan o&apos;quvchiga 0
        hisoblanadi.
      </p>
      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
