"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createAssignment,
  deleteAssignment,
  updateAssignment,
} from "@/app/(teacher)/teacher/homework/actions";
import { DatePicker } from "@/components/common/date-picker";
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
import type { AssignmentCategory, SemesterOption } from "@/lib/grades";
import { defaultHomeworkTitle } from "@/lib/homework";
import { formatDate, type DateStr } from "@/lib/time";
import {
  assignmentSchema,
  type AssignmentInput,
} from "@/lib/validators/grades";

export type { SemesterOption };

export type HomeworkRow = {
  id: string;
  semesterId: string;
  category: AssignmentCategory;
  categoryId: string;
  title: string;
  description: string | null;
  dueDate: DateStr;
  maxPoints: number;
  /** Ball qo'yilgan o'quvchilar soni (o'chirishda ogohlantirish) */
  gradedCount: number;
  /** Qaysi darsda berilgan (bo'lmasa null) */
  lessonId: string | null;
  lessonDate: DateStr | null;
};

/** Darsdan vazifa berishda oldindan to'ldiriladigan qiymatlar (lib/homework-data.ts) */
export type HomeworkInitial = {
  semesterId: string;
  lessonId: string;
  lessonDate: DateStr;
  title: string;
  dueDate: DateStr;
};

export function AddHomeworkButton({
  periods,
  defaultPeriodId,
  initial,
  label = "Topshiriq qo'shish",
  size = "default",
}: {
  periods: SemesterOption[];
  defaultPeriodId?: string;
  /** Darsdan berilganda: dars, semestr, nom va muddat tayyor */
  initial?: HomeworkInitial;
  label?: string;
  size?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size={size}
        onClick={() => setOpen(true)}
        disabled={periods.length === 0}
      >
        <PlusIcon />
        {label}
      </Button>
      <HomeworkDialog
        open={open}
        onOpenChange={setOpen}
        periods={periods}
        homework={null}
        defaultPeriodId={defaultPeriodId}
        initial={initial}
      />
    </>
  );
}

export function HomeworkRowActions({
  homework,
  periods,
}: {
  homework: HomeworkRow;
  periods: SemesterOption[];
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
        title="Topshiriqni o'chirish"
        description={
          homework.gradedCount > 0
            ? `"${homework.title}" o'chadi. ${homework.gradedCount} ta o'quvchiga qo'yilgan ball ham o'chadi.`
            : `"${homework.title}" o'chadi.`
        }
        confirmLabel="O'chirish"
        destructive
        action={() => deleteAssignment(homework.id)}
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
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periods: SemesterOption[];
  homework: HomeworkRow | null;
  defaultPeriodId?: string;
  initial?: HomeworkInitial;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {homework ? "Topshiriqni tahrirlash" : "Yangi topshiriq"}
          </DialogTitle>
        </DialogHeader>
        <HomeworkForm
          periods={periods}
          homework={homework}
          defaultPeriodId={defaultPeriodId}
          initial={initial}
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
  initial,
  onDone,
}: {
  periods: SemesterOption[];
  homework: HomeworkRow | null;
  defaultPeriodId?: string;
  initial?: HomeworkInitial;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const startSemesterId =
    homework?.semesterId ??
    initial?.semesterId ??
    defaultPeriodId ??
    periods[0]?.id ??
    "";
  const categoriesOf = (semesterId: string) =>
    periods.find((p) => p.id === semesterId)?.categories ?? [];
  // Yangi topshiriq odatda uyga vazifa (bo'lmasa — birinchi kategoriya)
  const startCategories = categoriesOf(startSemesterId);
  const defaultValues: AssignmentInput = homework
    ? {
        semesterId: homework.semesterId,
        categoryId: homework.categoryId,
        lessonId: homework.lessonId,
        title: homework.title,
        description: homework.description ?? "",
        dueDate: homework.dueDate,
        maxPoints: homework.maxPoints,
      }
    : {
        semesterId: startSemesterId,
        categoryId:
          (
            startCategories.find((c) => c.kind === "HOMEWORK") ??
            startCategories[0]
          )?.id ?? "",
        lessonId: initial?.lessonId ?? null,
        title: initial?.title ?? "",
        description: "",
        dueDate: initial?.dueDate ?? "",
        maxPoints: 1,
      };
  const lessonDate = homework?.lessonDate ?? initial?.lessonDate ?? null;
  const form = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues,
  });
  const { errors } = form.formState;
  const semesterId = useWatch({ control: form.control, name: "semesterId" });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const categories = categoriesOf(semesterId);
  const selected = categories.find((c) => c.id === categoryId);
  const category = selected?.kind;
  const defaultTitles = lessonDate
    ? new Set(
        periods.flatMap((p) =>
          p.categories.map((c) => defaultHomeworkTitle(lessonDate, c.name)),
        ),
      )
    : new Set<string>();
  const graded = (homework?.gradedCount ?? 0) > 0;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = homework
        ? await updateAssignment(homework.id, values)
        : await createAssignment(values);
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
      {lessonDate && (
        <p className="text-muted-foreground -mb-1 text-sm">
          Dars: {formatDate(lessonDate)}
        </p>
      )}
      <FormField
        id="hw-category"
        label="Kategoriya"
        error={errors.categoryId?.message}
      >
        <NativeSelect
          id="hw-category"
          disabled={graded}
          aria-invalid={!!errors.categoryId}
          {...form.register("categoryId", {
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
              const next = categories.find((c) => c.id === e.target.value);
              if (!next) return;
              // Uyga vazifaning maksimal bali — kategoriyaniki (odatda 1)
              if (next.kind === "HOMEWORK")
                form.setValue("maxPoints", next.itemMax);
              // Darsdan berilganda default nom kategoriyaga moslanadi ("Amaliy — 11.10")
              if (lessonDate && defaultTitles.has(form.getValues("title")))
                form.setValue(
                  "title",
                  defaultHomeworkTitle(lessonDate, next.name),
                );
            },
          })}
        >
          <NativeSelectOption value="" disabled>
            Kategoriyani tanlang
          </NativeSelectOption>
          {categories.map((c) => (
            <NativeSelectOption key={c.id} value={c.id}>
              {c.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      {lessonDate && category === "PRACTICAL" && (
        <p className="text-muted-foreground -mt-2 text-xs">
          Amaliy topshiriq shu darsning uyga vazifasi o&apos;rnida — bu darsga
          uyga vazifa berilmaydi.
        </p>
      )}
      {category === "EXTRA" && (
        <p className="text-muted-foreground -mt-2 text-xs">
          Qo&apos;shimcha ball semestr qoidasi bo&apos;yicha qo&apos;yiladi
          (shablonda belgilangan: kimga va qachon).
        </p>
      )}
      <FormField
        id="hw-period"
        label="Semestr"
        error={errors.semesterId?.message}
      >
        <NativeSelect
          id="hw-period"
          disabled={graded}
          aria-invalid={!!errors.semesterId}
          {...form.register("semesterId", {
            // Kategoriyalar semestrga xos: shu turdagisi (bo'lmasa birinchisi) tanlanadi
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
              const next = categoriesOf(e.target.value);
              const same =
                next.find((c) => c.name === selected?.name) ??
                next.find((c) => c.kind === selected?.kind) ??
                next[0];
              form.setValue("categoryId", same?.id ?? "");
            },
          })}
        >
          <NativeSelectOption value="" disabled>
            Semestrni tanlang
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
          <Controller
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <DatePicker
                id="hw-due"
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.dueDate}
              />
            )}
          />
        </FormField>
        {category === "HOMEWORK" ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Ball</span>
            <span className="text-muted-foreground text-sm">
              0 dan {selected?.itemMax ?? 1} gacha
            </span>
          </div>
        ) : (
          <FormField
            id="hw-max"
            label="Maksimal ball"
            error={errors.maxPoints?.message}
          >
            <Input
              id="hw-max"
              type="number"
              min={1}
              max={selected?.itemMax ?? 100}
              aria-invalid={!!errors.maxPoints}
              {...form.register("maxPoints", { valueAsNumber: true })}
            />
          </FormField>
        )}
      </div>
      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
