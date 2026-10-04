"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { saveSchedule } from "@/app/(teacher)/teacher/groups/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WEEKDAYS } from "@/lib/time";
import {
  scheduleFormSchema,
  type ScheduleFormInput,
} from "@/lib/validators/attendance";

type Row = { weekday: number; startTime: string; endTime: string };

export function ScheduleForm({
  groupId,
  initial,
}: {
  groupId: string;
  initial: Row[];
}) {
  const [pending, startTransition] = useTransition();
  const byDay = new Map(initial.map((r) => [r.weekday, r]));
  const defaultValues: ScheduleFormInput = {
    days: WEEKDAYS.map((d) => ({
      weekday: d.value,
      enabled: byDay.has(d.value),
      startTime: byDay.get(d.value)?.startTime ?? "",
      endTime: byDay.get(d.value)?.endTime ?? "",
    })),
  };
  const form = useForm({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues,
  });
  const days = useWatch({ control: form.control, name: "days" });
  const { errors } = form.formState;

  /** Kun yoqilganda bo'sh vaqtni oldingi yoqilgan kundan nusxalaydi — tez kiritish uchun */
  function toggle(index: number, enabled: boolean) {
    form.setValue(`days.${index}.enabled`, enabled);
    if (!enabled || days[index].startTime) return;
    const prev = days.find((d) => d.enabled && d.startTime && d.endTime);
    form.setValue(`days.${index}.startTime`, prev?.startTime ?? "14:00");
    form.setValue(`days.${index}.endTime`, prev?.endTime ?? "16:00");
  }

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveSchedule(groupId, values);
      if (result.ok) {
        toast.success(result.message);
        form.reset(values);
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <ul className="flex flex-col gap-2">
        {WEEKDAYS.map((d, i) => {
          const enabled = days[i]?.enabled;
          const rowErrors = errors.days?.[i];
          return (
            <li key={d.value} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex w-32 items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="accent-primary size-4"
                    checked={enabled ?? false}
                    onChange={(e) => toggle(i, e.target.checked)}
                  />
                  {d.long}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    aria-label={`${d.long}: boshlanish`}
                    className="w-28"
                    disabled={!enabled}
                    aria-invalid={!!rowErrors?.startTime}
                    {...form.register(`days.${i}.startTime`)}
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="time"
                    aria-label={`${d.long}: tugash`}
                    className="w-28"
                    disabled={!enabled}
                    aria-invalid={!!rowErrors?.endTime}
                    {...form.register(`days.${i}.endTime`)}
                  />
                </div>
              </div>
              {(rowErrors?.startTime || rowErrors?.endTime) && (
                <p className="text-destructive text-sm">
                  {rowErrors.startTime?.message ?? rowErrors.endTime?.message}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <FormError message={errors.root?.server?.message} />
      <div>
        <Button type="submit" disabled={pending}>
          Jadvalni saqlash
        </Button>
      </div>
    </form>
  );
}
