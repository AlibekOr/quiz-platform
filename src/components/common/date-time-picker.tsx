"use client";

import { DatePicker } from "./date-picker";
import { TimePicker } from "./time-picker";

// Sana + vaqt bitta qiymatda: "2026-10-18T10:00" (Toshkent), bo'sh — "".
// Sana tanlanganda vaqt bo'sh bo'lsa defaultTime qo'yiladi; sana tozalansa qiymat ham bo'shaydi

export function DateTimePicker({
  id,
  value,
  onChange,
  defaultTime,
  placeholder,
  invalid,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  defaultTime: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [date = "", time = ""] = value ? value.split("T") : [];

  return (
    <div className="flex gap-2">
      <DatePicker
        id={id}
        className="min-w-0 flex-1"
        clearable
        placeholder={placeholder}
        invalid={invalid}
        disabled={disabled}
        value={date}
        onChange={(d) => onChange(d ? `${d}T${time || defaultTime}` : "")}
      />
      <TimePicker
        aria-label="Vaqt"
        className="w-24 shrink-0"
        invalid={invalid}
        disabled={disabled || !date}
        value={time}
        onChange={(t) => onChange(`${date}T${t}`)}
      />
    </div>
  );
}
