"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saveRiskSettings } from "@/app/(teacher)/teacher/risk/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  riskSettingsSchema,
  type RiskSettingsInput,
} from "@/lib/validators/risk";

type EnabledField =
  | "absencesEnabled"
  | "attendanceEnabled"
  | "missedEnabled"
  | "paceEnabled"
  | "penaltiesEnabled";
type NumberField = Exclude<keyof RiskSettingsInput, EnabledField>;

const SIGNALS: {
  enabled: EnabledField;
  title: string;
  fields: { name: NumberField; label: string; step?: number }[];
}[] = [
  {
    enabled: "absencesEnabled",
    title: "Ketma-ket dars qoldirish",
    fields: [{ name: "absencesMin", label: "Kamida necha dars" }],
  },
  {
    enabled: "attendanceEnabled",
    title: "Davomat past",
    fields: [
      { name: "attendanceBelow", label: "Davomat, % dan kam" },
      { name: "attendanceMinLessons", label: "Kamida necha dars o'tgach" },
    ],
  },
  {
    enabled: "missedEnabled",
    title: "Vazifalar topshirilmagan",
    fields: [
      { name: "missedLastN", label: "Oxirgi nechta vazifa" },
      { name: "missedMin", label: "Ulardan topshirilmagan" },
    ],
  },
  {
    enabled: "paceEnabled",
    title: "Ball sur'ati orqada",
    fields: [
      { name: "paceRatio", label: "Kutilganning qismi (0,8)", step: 0.05 },
      { name: "paceGraceDays", label: "Boshida tekshirilmaydigan kunlar" },
      {
        name: "paceHighAfter",
        label: "Semestrning qaysi qismidan — Yuqori (0,7)",
        step: 0.05,
      },
    ],
  },
  {
    enabled: "penaltiesEnabled",
    title: "Jarimalar ko'p",
    fields: [
      { name: "penaltiesWindowDays", label: "Oxirgi necha kun" },
      { name: "penaltiesMin", label: "Kamida necha ball", step: 0.5 },
    ],
  },
];

export function RiskSettingsForm({ initial }: { initial: RiskSettingsInput }) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(riskSettingsSchema),
    defaultValues: initial,
  });
  const { errors } = form.formState;
  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveRiskSettings(values);
      if (result.ok) toast.success(result.message);
      else applyServerErrors(form, result);
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {SIGNALS.map((s) => (
        <fieldset
          key={s.enabled}
          className="flex flex-col gap-3 rounded-lg border p-4"
        >
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              className="accent-primary size-4"
              {...form.register(s.enabled)}
            />
            {s.title}
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {s.fields.map((f) => (
              <label key={f.name} className="flex flex-col gap-1 text-sm">
                {f.label}
                <Input
                  type="number"
                  step={f.step ?? 1}
                  aria-invalid={!!errors[f.name]}
                  {...form.register(f.name, { valueAsNumber: true })}
                />
                <FormError message={errors[f.name]?.message} />
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <FormError message={errors.root?.server?.message} />
      <div>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </div>
    </form>
  );
}
