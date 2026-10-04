"use client";

import { useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import { resetStudentPassword } from "@/app/teacher/students/actions";
import { FormError } from "@/components/common/form-field";
import { formError, useFormAction } from "@/components/common/use-form-action";
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
  const [state, action, pending] = useFormAction(
    resetStudentPassword.bind(null, studentId),
    onDone,
  );
  const [password, setPassword] = useState(generatePassword);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">Yangi parol</Label>
        <div className="flex gap-2">
          <Input
            id="new-password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            required
            minLength={6}
            maxLength={72}
            className="font-mono"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Yangi parol yaratish"
            onClick={() => setPassword(generatePassword())}
          >
            <RefreshCwIcon />
          </Button>
        </div>
      </div>
      <FormError message={formError(state)} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Parolni saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
