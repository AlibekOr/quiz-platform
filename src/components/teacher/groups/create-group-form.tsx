"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createGroup } from "@/app/(teacher)/teacher/groups/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { groupFormSchema } from "@/lib/validators/student";

export function CreateGroupForm({
  regions,
}: {
  regions: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: "" },
  });
  const [regionId, setRegionId] = useState("");
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await createGroup({ ...values, regionId });
      if (result.ok) {
        toast.success(result.message);
        form.reset();
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Yangi guruh nomi"
          aria-label="Guruh nomi"
          aria-invalid={!!errors.name}
          maxLength={64}
          {...form.register("name")}
        />
        {regions.length > 0 && (
          <NativeSelect
            aria-label="Region"
            value={regionId}
            onChange={(e) => setRegionId(e.target.value)}
          >
            <NativeSelectOption value="">Regionsiz</NativeSelectOption>
            {regions.map((r) => (
              <NativeSelectOption key={r.id} value={r.id}>
                {r.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
        <Button type="submit" disabled={pending}>
          Guruh qo&apos;shish
        </Button>
      </div>
      <FormError
        message={errors.name?.message ?? errors.root?.server?.message}
      />
    </form>
  );
}
