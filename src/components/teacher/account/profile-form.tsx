"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateOwnProfile } from "@/app/(teacher)/teacher/account/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validators/auth";

export function ProfileForm({ fullName }: { fullName: string }) {
  const [pending, startTransition] = useTransition();
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateOwnProfile(values);
      if (result.ok) {
        toast.success(result.message);
        form.reset({ fullName: values.fullName.trim() });
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
      <FormField
        id="fullName"
        label="Ism familiya"
        error={errors.fullName?.message}
      >
        <Input
          id="fullName"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          {...form.register("fullName")}
        />
      </FormField>
      <FormError message={errors.root?.server?.message} />
      <Button
        type="submit"
        disabled={pending || !isDirty}
        className="self-start"
      >
        {pending ? "Saqlanmoqda..." : "Saqlash"}
      </Button>
    </form>
  );
}
