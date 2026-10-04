"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth/actions";
import { loginSchema } from "@/lib/validators/auth";

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      // Muvaffaqiyatda action redirect qiladi
      const result = await login(values);
      applyServerErrors(form, result);
      form.resetField("password");
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="username" label="Login" error={errors.username?.message}>
        <Input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          aria-invalid={!!errors.username}
          {...form.register("username")}
        />
      </FormField>
      <FormField id="password" label="Parol" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...form.register("password")}
        />
      </FormField>
      <FormError message={errors.root?.server?.message} />
      <Button type="submit" disabled={pending}>
        {pending ? "Kirilmoqda..." : "Kirish"}
      </Button>
    </form>
  );
}
