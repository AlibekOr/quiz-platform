"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { transferStudents } from "@/app/(teacher)/teacher/students/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
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
import { Textarea } from "@/components/ui/textarea";
import { todayInTashkent } from "@/lib/time";
import { transferSchema } from "@/lib/validators/student";
import type { GroupOption } from "./types";

export type TransferStudent = {
  id: string;
  fullName: string;
  groupId: string | null;
};

/** Bir yoki bir nechta o'quvchini boshqa guruhga o'tkazish (guruhsizlarni guruhga qo'shish) */
export function TransferDialog({
  open,
  onOpenChange,
  students,
  groups,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: TransferStudent[];
  groups: GroupOption[];
  /** Muvaffaqiyatli o'tkazilgandan keyin (masalan, tanlovni tozalash) */
  onDone?: () => void;
}) {
  const allGroupless = students.every((s) => s.groupId === null);
  const title = allGroupless ? "Guruhga qo'shish" : "Boshqa guruhga o'tkazish";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {students.length === 1
              ? students[0].fullName
              : `${students.length} ta o'quvchi`}
            . Test natijalari o&apos;quvchi bilan birga ko&apos;chadi. Davomatda
            o&apos;quvchi sanagacha eski guruhda, sanadan boshlab yangi guruhda
            ko&apos;rinadi.
          </DialogDescription>
        </DialogHeader>
        <TransferForm
          students={students}
          groups={groups}
          submitLabel={allGroupless ? "Qo'shish" : "O'tkazish"}
          onDone={() => {
            onOpenChange(false);
            onDone?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function TransferForm({
  students,
  groups,
  submitLabel,
  onDone,
}: {
  students: TransferStudent[];
  groups: GroupOption[];
  submitLabel: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const today = todayInTashkent();
  // Hammasi bitta guruhda bo'lsa, o'sha guruh ro'yxatda ko'rsatilmaydi
  const currentGroups = new Set(students.map((s) => s.groupId));
  const sameGroup = currentGroups.size === 1 ? [...currentGroups][0] : null;
  const options = groups.filter((g) => g.id !== sameGroup);

  const form = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      studentIds: students.map((s) => s.id),
      toGroupId: "",
      date: today,
      note: "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await transferStudents(values);
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
        id="toGroupId"
        label="Yangi guruh"
        error={errors.toGroupId?.message}
      >
        <NativeSelect
          id="toGroupId"
          aria-invalid={!!errors.toGroupId}
          {...form.register("toGroupId")}
        >
          <NativeSelectOption value="" disabled>
            Guruhni tanlang
          </NativeSelectOption>
          {options.map((g) => (
            <NativeSelectOption key={g.id} value={g.id}>
              {g.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormField id="date" label="Sana" error={errors.date?.message}>
        <Input
          id="date"
          type="date"
          max={today}
          aria-invalid={!!errors.date}
          {...form.register("date")}
        />
      </FormField>
      <FormField
        id="note"
        label="Izoh (ixtiyoriy)"
        error={errors.note?.message}
      >
        <Textarea
          id="note"
          rows={2}
          maxLength={300}
          aria-invalid={!!errors.note}
          {...form.register("note")}
        />
      </FormField>
      <FormError
        message={errors.studentIds?.message ?? errors.root?.server?.message}
      />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
