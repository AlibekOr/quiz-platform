"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateOwnContacts } from "@/app/(account)/profile/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ownContactsSchema,
  type OwnContactsInput,
} from "@/lib/validators/auth";

/** O'quvchi o'z telefoni va Telegramini tahrirlaydi. Saqlangach formatlangan qiymat ko'rsatiladi */
export function ContactsForm({
  phone,
  telegram,
}: {
  phone: string | null;
  telegram: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<OwnContactsInput>({
    resolver: zodResolver(ownContactsSchema),
    defaultValues: { phone: phone ?? "", telegram: telegram ?? "" },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateOwnContacts(values);
      if (result.ok) {
        toast.success(result.message);
        // Server qiymatni +998... / @username ko'rinishiga keltiradi
        const parsed = ownContactsSchema.safeParse(values);
        if (parsed.success)
          form.reset({
            phone: parsed.data.phone ?? "",
            telegram: parsed.data.telegram ?? "",
          });
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="phone" label="Telefon" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="90 123 45 67"
            aria-invalid={!!errors.phone}
            {...form.register("phone")}
          />
        </FormField>
        <FormField
          id="telegram"
          label="Telegram"
          error={errors.telegram?.message}
        >
          <Input
            id="telegram"
            placeholder="@username yoki telefon"
            autoCapitalize="none"
            aria-invalid={!!errors.telegram}
            {...form.register("telegram")}
          />
        </FormField>
      </div>
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
