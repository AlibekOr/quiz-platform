"use client";

import { useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import { createStudent, updateStudent } from "@/app/teacher/students/actions";
import { FormError, FormField } from "@/components/common/form-field";
import {
  fieldError,
  formError,
  useFormAction,
} from "@/components/common/use-form-action";
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
import { generatePassword } from "@/lib/students/generate-password";
import type { GroupOption, StudentRow } from "./types";

export function StudentDialog({
  open,
  onOpenChange,
  groups,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: GroupOption[];
  /** Berilmasa — yangi o'quvchi */
  student?: StudentRow;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {student ? "O'quvchini tahrirlash" : "Yangi o'quvchi"}
          </DialogTitle>
          {!student && (
            <DialogDescription>
              Login va parolni o&apos;quvchiga o&apos;zingiz berasiz.
            </DialogDescription>
          )}
        </DialogHeader>
        <StudentForm
          groups={groups}
          student={student}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function StudentForm({
  groups,
  student,
  onDone,
}: {
  groups: GroupOption[];
  student?: StudentRow;
  onDone: () => void;
}) {
  const [state, action, pending] = useFormAction(
    student ? updateStudent.bind(null, student.id) : createStudent,
    onDone,
  );
  const [password, setPassword] = useState(() =>
    student ? "" : generatePassword(),
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormField
        id="fullName"
        label="F.I.Sh"
        error={fieldError(state, "fullName")}
      >
        <Input
          id="fullName"
          name="fullName"
          defaultValue={student?.fullName}
          required
          maxLength={100}
        />
      </FormField>
      <FormField
        id="username"
        label="Login"
        error={fieldError(state, "username")}
      >
        <Input
          id="username"
          name="username"
          defaultValue={student?.username}
          autoCapitalize="none"
          autoComplete="off"
          required
          maxLength={32}
        />
      </FormField>
      {!student && (
        <FormField
          id="password"
          label="Parol"
          error={fieldError(state, "password")}
        >
          <div className="flex gap-2">
            <Input
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              required
              minLength={6}
              maxLength={72}
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
        </FormField>
      )}
      <FormField
        id="groupId"
        label="Guruh"
        error={fieldError(state, "groupId")}
      >
        <NativeSelect
          id="groupId"
          name="groupId"
          defaultValue={student?.groupId ?? ""}
          required
        >
          <NativeSelectOption value="" disabled>
            Guruhni tanlang
          </NativeSelectOption>
          {groups.map((g) => (
            <NativeSelectOption key={g.id} value={g.id}>
              {g.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      <FormError message={formError(state)} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {student ? "Saqlash" : "Qo'shish"}
        </Button>
      </DialogFooter>
    </form>
  );
}
