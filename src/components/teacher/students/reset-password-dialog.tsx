"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { RefreshCwIcon } from "lucide-react";
import { resetStudentPassword } from "@/app/(teacher)/teacher/students/actions";
import { FormError } from "@/components/common/form-field";
import { applyServerErrors } from "@/components/common/form-errors";
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
import { Label } from "@/components/ui/label";
import { generatePassword } from "@/lib/students/generate-password";
import { resetPasswordSchema } from "@/lib/validators/student";
import type { StudentRow } from "./types";

export function ResetPasswordDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentRow;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parolni tiklash</DialogTitle>
          <DialogDescription>
            {student.fullName} ({student.username}) uchun yangi parol.
            Saqlashdan oldin uni yozib oling.
          </DialogDescription>
        </DialogHeader>
        <ResetForm studentId={student.id} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ResetForm({
  studentId,
  onDone,
}: {
  studentId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: generatePassword() },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await resetStudentPassword(studentId, values);
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Yangi parol</Label>
        <div className="flex gap-2">
          <Input
            id="new-password"
            autoComplete="off"
            className="font-mono"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Yangi parol yaratish"
            onClick={() =>
              form.setValue("password", generatePassword(), {
                shouldValidate: true,
              })
            }
          >
            <RefreshCwIcon />
          </Button>
        </div>
      </div>
      <FormError
        message={errors.password?.message ?? errors.root?.server?.message}
      />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Parolni saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
