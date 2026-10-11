"use client";

import { CalendarIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { MONTHS, todayInTashkent, type DateStr } from "@/lib/time";
import { cn } from "@/lib/utils";

// Sana, oy va vaqt tanlash: brauzerning standart tanlagichi (telefonda — tizim g'ildiragi),
// lekin maydon dizaynga moslangan: chapda ikonka, standart ikonka yashirilgan, maydonning
// istalgan joyi bosilganda tanlagich ochiladi. Qiymatlar matn: "2026-10-04", "2026-10", "14:00"

export type PickerProps = {
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
};

/** Standart ikonkani yashiradi (o'rniga chapdagi ikonka), qiymat chap ikonkadan keyin */
export const NATIVE_PICKER_CLASS =
  "pl-8 tabular-nums [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-date-and-time-value]:text-left cursor-pointer";

/** Maydonning istalgan joyi bosilganda standart tanlagichni ochish (qo'llamaydigan brauzer — o'zi ochadi) */
export function openPicker(e: React.MouseEvent<HTMLInputElement>) {
  try {
    e.currentTarget.showPicker?.();
  } catch {
    // Ba'zi brauzerlar ruxsat bermaydi — standart xatti-harakat qoladi
  }
}

export function PickerIcon({ icon: Icon }: { icon: typeof CalendarIcon }) {
  return (
    <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
  );
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  clearable = false,
  className,
  invalid,
  ...props
}: PickerProps & {
  value: string;
  onChange: (value: DateStr | "") => void;
  min?: DateStr;
  max?: DateStr;
  /** "Tozalash" tugmasi (ixtiyoriy maydonlar uchun) */
  clearable?: boolean;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <PickerIcon icon={CalendarIcon} />
      <Input
        type="date"
        value={value}
        min={min}
        max={max}
        aria-invalid={invalid || undefined}
        onClick={openPicker}
        onChange={(e) => onChange(e.target.value)}
        className={cn(NATIVE_PICKER_CLASS, clearable && value && "pr-8")}
        {...props}
      />
      {clearable && value && !props.disabled && (
        <button
          type="button"
          aria-label="Tozalash"
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Oy tanlash: oy nomi va yil (ikki ro'yxat). Safari kompyuterda type="month" ni
 * qo'llamaydi — shuning uchun standart select'lar
 */
export function MonthPicker({
  value,
  onChange,
  max,
  className,
  invalid,
  disabled,
  ...props
}: PickerProps & {
  value: string;
  onChange: (value: string) => void;
  /** "2026-10" */
  max?: string;
}) {
  const current = value || todayInTashkent().slice(0, 7);
  const [year, month] = current.split("-");
  const maxYear = Number((max ?? current).slice(0, 4));
  // Oxirgi 5 yil (tanlangan yil eskiroq bo'lsa ham ro'yxatda bo'ladi)
  const years = Array.from({ length: 5 }, (_, i) => String(maxYear - i));
  if (!years.includes(year)) years.push(year);

  function update(nextYear: string, nextMonth: string) {
    let next = `${nextYear}-${nextMonth}`;
    // Yil almashganda oy chegaradan o'tib ketsa — eng oxirgi ruxsat etilgan oy
    if (max && next > max) next = max;
    onChange(next);
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <NativeSelect
        aria-label={`${props["aria-label"] ?? "Oy"}: oy`}
        id={props.id}
        value={month}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={(e) => update(year, e.target.value)}
      >
        {MONTHS.map((name, i) => {
          const m = String(i + 1).padStart(2, "0");
          return (
            <NativeSelectOption
              key={m}
              value={m}
              disabled={!!max && `${year}-${m}` > max}
            >
              {name}
            </NativeSelectOption>
          );
        })}
      </NativeSelect>
      <NativeSelect
        aria-label={`${props["aria-label"] ?? "Oy"}: yil`}
        value={year}
        disabled={disabled}
        onChange={(e) => update(e.target.value, month)}
      >
        {years.map((y) => (
          <NativeSelectOption key={y} value={y}>
            {y}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}
