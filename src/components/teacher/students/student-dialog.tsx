"use client";

import { useTransition } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";
import {
  createStudent,
  updateStudent,
} from "@/app/(teacher)/teacher/students/actions";
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
import { generatePassword } from "@/lib/students/generate-password";
import {
  studentCreateSchema,
  studentUpdateSchema,
  type StudentUpdateInput,
} from "@/lib/validators/student";
import { EMPTY_PROFILE } from "@/lib/validators/contact";
import { ContactFields } from "./contact-fields";
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
  const onDone = () => onOpenChange(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
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
        {student ? (
          <EditStudentForm groups={groups} student={student} onDone={onDone} />
        ) : (
          <CreateStudentForm groups={groups} onDone={onDone} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateStudentForm({
  groups,
  onDone,
}: {
  groups: GroupOption[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: {
      fullName: "",
      username: "",
      groupId: "",
      password: generatePassword(),
      ...EMPTY_PROFILE,
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await createStudent(values);
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <StudentFields groups={groups} />
        <FormField id="password" label="Parol" error={errors.password?.message}>
          <div className="flex gap-2">
            <Input
              id="password"
              autoComplete="off"
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
        </FormField>
        <ContactFields />
        <FormError message={errors.root?.server?.message} />
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            Qo&apos;shish
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

function EditStudentForm({
  groups,
  student,
  onDone,
}: {
  groups: GroupOption[];
  student: StudentRow;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(studentUpdateSchema),
    defaultValues: {
      fullName: student.fullName,
      username: student.username,
      groupId: student.groupId ?? "",
      phone: student.profile?.phone ?? "",
      telegram: student.profile?.telegram ?? "",
      parentName: student.profile?.parentName ?? "",
      parentRelation: student.profile?.parentRelation ?? "",
      parentPhone: student.profile?.parentPhone ?? "",
      note: student.profile?.note ?? "",
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateStudent(student.id, values);
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <StudentFields groups={groups} />
        <ContactFields />
        <FormError message={errors.root?.server?.message} />
        <DialogFooter>
          <Button type="submit" disabled={pending}>
            Saqlash
          </Button>
        </DialogFooter>
      </form>
    </FormProvider>
  );
}

/** Yaratish va tahrirlash formalari uchun umumiy maydonlar (fullName, username, groupId) */
function StudentFields({ groups }: { groups: GroupOption[] }) {
  // Ikkala forma ham shu maydonlarga ega
  const {
    register,
    formState: { errors },
  } = useFormContext<StudentUpdateInput>();

  return (
    <>
      <FormField id="fullName" label="F.I.Sh" error={errors.fullName?.message}>
        <Input
          id="fullName"
          maxLength={100}
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
      </FormField>
      <FormField id="username" label="Login" error={errors.username?.message}>
        <Input
          id="username"
          autoCapitalize="none"
          autoComplete="off"
          maxLength={32}
          aria-invalid={!!errors.username}
          {...register("username")}
        />
      </FormField>
      <FormField id="groupId" label="Guruh" error={errors.groupId?.message}>
        <NativeSelect
          id="groupId"
          aria-invalid={!!errors.groupId}
          {...register("groupId")}
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
    </>
  );
}
