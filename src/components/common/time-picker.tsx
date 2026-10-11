"use client";

import { ClockIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  NATIVE_PICKER_CLASS,
  openPicker,
  PickerIcon,
  type PickerProps,
} from "./date-picker";

/** Vaqt tanlash ("14:00"): standart tanlagich, 5 daqiqa qadam, dizaynga moslangan maydon */
export function TimePicker({
  value,
  onChange,
  className,
  invalid,
  ...props
}: PickerProps & {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <PickerIcon icon={ClockIcon} />
      <Input
        type="time"
        step={300}
        value={value}
        aria-invalid={invalid || undefined}
        onClick={openPicker}
        onChange={(e) => onChange(e.target.value)}
        className={NATIVE_PICKER_CLASS}
        {...props}
      />
    </div>
  );
}
