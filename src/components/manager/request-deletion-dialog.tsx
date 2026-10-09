"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { requestStudentDeletion } from "@/app/(manager)/manager/students/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { deletionRequestSchema } from "@/lib/validators/manager";

/** Menejer: o'quvchini o'chirishni so'rash (o'qituvchi tasdiqlasa arxivlanadi) */
export function RequestDeletionDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: { id: string; fullName: string };
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>O&apos;chirishni so&apos;rash</DialogTitle>
          <DialogDescription>
            {student.fullName}. So&apos;rov o&apos;qituvchiga yuboriladi:
            tasdiqlansa o&apos;quvchi arxivlanadi.
          </DialogDescription>
        </DialogHeader>
        <RequestForm
          studentId={student.id}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({
  studentId,
  onDone,
}: {
  studentId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(deletionRequestSchema),
    defaultValues: { reason: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await requestStudentDeletion(studentId, values);
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
      <FormField id="del-reason" label="Sabab" error={errors.reason?.message}>
        <Textarea
          id="del-reason"
          rows={3}
          maxLength={500}
          aria-invalid={!!errors.reason}
          {...form.register("reason")}
        />
      </FormField>
      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" variant="destructive" disabled={pending}>
          So&apos;rov yuborish
        </Button>
      </DialogFooter>
    </form>
  );
}
