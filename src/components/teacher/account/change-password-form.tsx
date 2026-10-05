"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { changeOwnPassword } from "@/app/(teacher)/teacher/account/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validators/auth";

const FIELDS = [
  {
    name: "currentPassword",
    label: "Joriy parol",
    autoComplete: "current-password",
  },
  { name: "newPassword", label: "Yangi parol", autoComplete: "new-password" },
  {
    name: "confirmPassword",
    label: "Yangi parolni takrorlang",
    autoComplete: "new-password",
  },
] as const;

const EMPTY: ChangePasswordInput = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await changeOwnPassword(values);
      if (result.ok) {
        toast.success(result.message);
        form.reset(EMPTY);
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <form
      onSubmit={onSubmit}
      className="flex max-w-sm flex-col gap-4"
      noValidate
    >
      {FIELDS.map((f) => (
        <FormField
          key={f.name}
          id={f.name}
          label={f.label}
          error={errors[f.name]?.message}
        >
          <Input
            id={f.name}
            type="password"
            autoComplete={f.autoComplete}
            aria-invalid={!!errors[f.name]}
            {...form.register(f.name)}
          />
        </FormField>
      ))}
      <FormError message={errors.root?.server?.message} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
      </Button>
    </form>
  );
}
