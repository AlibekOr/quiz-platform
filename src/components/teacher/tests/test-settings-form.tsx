"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateTestSettings } from "@/app/(teacher)/teacher/tests/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import type { GroupOption } from "@/components/teacher/students/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  testSettingsSchema,
  type TestSettingsInput,
} from "@/lib/validators/test";

const FLAGS = [
  {
    key: "allowRetake",
    label: "Qayta ishlashga ruxsat",
    hint: "Tayyorlov uchun yoqilgan: o'quvchi xohlagancha qayta ishlaydi. Reytingga faqat birinchi urinish kiradi",
  },
  {
    key: "showAnswers",
    label: "Natijada to'g'ri javoblarni ko'rsatish",
    hint: undefined,
  },
  {
    key: "shuffleQuestions",
    label: "Savollarni aralashtirish",
    hint: "Har bir o'quvchida tartib har xil",
  },
] as const;

export function TestSettingsForm({
  testId,
  initial,
  groups,
}: {
  testId: string;
  initial: TestSettingsInput;
  groups: GroupOption[];
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(testSettingsSchema),
    defaultValues: initial,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await updateTestSettings(testId, values);
      if (result.ok) {
        toast.success(result.message);
        // Yangi qiymatlar "boshlang'ich" bo'ladi (isDirty to'g'ri ishlashi uchun)
        form.reset(form.getValues());
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-lg border p-4"
      noValidate
    >
      <h2 className="font-semibold">Sozlamalar</h2>
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <FormField id="title" label="Nomi" error={errors.title?.message}>
          <Input
            id="title"
            maxLength={200}
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
      </div>
      <FormField
        id="description"
        label="Tavsif"
        error={errors.description?.message}
      >
        <Textarea
          id="description"
          maxLength={2000}
          rows={2}
          {...form.register("description")}
        />
      </FormField>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Qoidalar</legend>
        {FLAGS.map(({ key, label, hint }) => (
          <label key={key} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-primary mt-0.5 size-4"
              {...form.register(key)}
            />
            <span>
              {label}
              {hint && (
                <span className="text-muted-foreground block">{hint}</span>
              )}
            </span>
          </label>
        ))}
      </fieldset>

      <Controller
        control={form.control}
        name="groupIds"
        render={({ field }) => (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Guruhlar</legend>
            {groups.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Guruhlar yo&apos;q.
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {groups.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="accent-primary size-4"
                      checked={field.value.includes(g.id)}
                      onChange={(e) =>
                        field.onChange(
                          e.target.checked
                            ? [...field.value, g.id]
                            : field.value.filter((id) => id !== g.id),
                        )
                      }
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            )}
            {field.value.length === 0 && groups.length > 0 && (
              <p className="text-muted-foreground text-sm">
                Guruh tanlanmasa, testni hech kim ko&apos;rmaydi.
              </p>
            )}
          </fieldset>
        )}
      />

      <FormError
        message={errors.groupIds?.message ?? errors.root?.server?.message}
      />
      <div>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </div>
    </form>
  );
}
