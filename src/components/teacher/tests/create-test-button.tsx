"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { createTest } from "@/app/(teacher)/teacher/tests/actions";
import { FormError, FormField } from "@/components/common/form-field";
import { applyServerErrors } from "@/components/common/form-errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createTestSchema } from "@/lib/validators/test";

export function CreateTestButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Yangi test
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi test</DialogTitle>
          </DialogHeader>
          <CreateTestForm />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateTestForm() {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(createTestSchema),
    defaultValues: { title: "", durationMin: 20 },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      // Muvaffaqiyatda action test sahifasiga redirect qiladi
      const result = await createTest(values);
      applyServerErrors(form, result);
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="title" label="Test nomi" error={errors.title?.message}>
        <Input
          id="title"
          maxLength={200}
          autoFocus
          aria-invalid={!!errors.title}
          {...form.register("title")}
        />
      </FormField>
      <FormField
        id="durationMin"
        label="Vaqt (daqiqa)"
        error={errors.durationMin?.message}
      >
        <Input
          id="durationMin"
          type="number"
          min={1}
          max={300}
          aria-invalid={!!errors.durationMin}
          {...form.register("durationMin", { valueAsNumber: true })}
        />
      </FormField>
      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Yaratish
        </Button>
      </DialogFooter>
    </form>
  );
}
