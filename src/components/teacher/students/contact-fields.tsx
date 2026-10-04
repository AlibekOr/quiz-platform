"use client";

import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/common/form-field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  PARENT_RELATION_LABELS,
  PARENT_RELATIONS,
  type StudentProfileInput,
} from "@/lib/validators/contact";

/** O'quvchi formasidagi ixtiyoriy aloqa maydonlari */
export function ContactFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<StudentProfileInput>();

  return (
    <fieldset className="flex flex-col gap-4 border-t pt-4">
      <legend className="sr-only">Aloqa ma&apos;lumotlari</legend>
      <p className="text-sm font-medium">
        Aloqa{" "}
        <span className="text-muted-foreground font-normal">(ixtiyoriy)</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="phone" label="Telefon" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="90 123 45 67"
            aria-invalid={!!errors.phone}
            {...register("phone")}
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
            {...register("telegram")}
          />
        </FormField>
        <FormField
          id="parentName"
          label="Ota-ona ismi"
          error={errors.parentName?.message}
        >
          <Input
            id="parentName"
            maxLength={100}
            aria-invalid={!!errors.parentName}
            {...register("parentName")}
          />
        </FormField>
        <FormField
          id="parentRelation"
          label="Kimligi"
          error={errors.parentRelation?.message}
        >
          <NativeSelect id="parentRelation" {...register("parentRelation")}>
            <NativeSelectOption value="">—</NativeSelectOption>
            {PARENT_RELATIONS.map((r) => (
              <NativeSelectOption key={r} value={r}>
                {PARENT_RELATION_LABELS[r]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          id="parentPhone"
          label="Ota-ona telefoni"
          error={errors.parentPhone?.message}
        >
          <Input
            id="parentPhone"
            type="tel"
            inputMode="tel"
            placeholder="90 123 45 67"
            aria-invalid={!!errors.parentPhone}
            {...register("parentPhone")}
          />
        </FormField>
      </div>
      <FormField id="note" label="Izoh" error={errors.note?.message}>
        <Textarea id="note" rows={2} maxLength={1000} {...register("note")} />
      </FormField>
    </fieldset>
  );
}
