"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  addMonths,
  calendarDays,
  formatDate,
  formatMonth,
  MONTHS,
  todayInTashkent,
  WEEKDAYS,
  type DateStr,
} from "@/lib/time";
import { cn } from "@/lib/utils";

// Sana va oy tanlash (brauzerning standart oynasi o'rniga, dizaynga mos).
// Qiymatlar matn: "2026-10-04" va "2026-10"; bo'sh qiymat — "" (tanlanmagan)

/** Input bilan bir xil ko'rinadigan tugma (vaqt tanlashda ham ishlatiladi) */
export const PICKER_TRIGGER_CLASS =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 data-invalid:border-destructive data-invalid:ring-destructive/20 dark:bg-input/30 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border bg-transparent px-2.5 text-left text-base transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-invalid:ring-3 md:text-sm";

/** Popover ichidagi tanlanadigan katak (kun, oy, soat, daqiqa) */
export function pickerCellClass(selected: boolean): string {
  return cn(
    "hover:bg-accent hover:text-accent-foreground rounded-md text-sm tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-30",
    selected &&
      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
  );
}

export type PickerProps = {
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  placeholder?: string;
};

function NavButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      onClick={onClick}
      aria-label={dir === "prev" ? "Oldingi" : "Keyingi"}
    >
      <Icon />
    </Button>
  );
}

function inRange(value: string, min?: string, max?: string): boolean {
  return (!min || value >= min) && (!max || value <= max);
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Sanani tanlang",
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
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() =>
    (value || todayInTashkent()).slice(0, 7),
  );
  const today = todayInTashkent();

  function pick(next: DateStr | "") {
    onChange(next);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Har ochilganda tanlangan sana (yoki bugun) oyi ko'rsatiladi
        if (next)
          setView((value || (max && today > max ? max : today)).slice(0, 7));
        setOpen(next);
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            data-invalid={invalid || undefined}
            className={cn(PICKER_TRIGGER_CLASS, className)}
            {...props}
          />
        }
      >
        <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
        <span
          className={cn("flex-1 truncate", !value && "text-muted-foreground")}
        >
          {value ? formatDate(value) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-2">
        <div className="flex items-center justify-between gap-2">
          <NavButton
            dir="prev"
            disabled={!!min && addMonths(view, -1) < min.slice(0, 7)}
            onClick={() => setView(addMonths(view, -1))}
          />
          <span className="text-sm font-medium">{formatMonth(view)}</span>
          <NavButton
            dir="next"
            disabled={!!max && addMonths(view, 1) > max.slice(0, 7)}
            onClick={() => setView(addMonths(view, 1))}
          />
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((w) => (
            <span
              key={w.value}
              className="text-muted-foreground py-1 text-xs font-medium"
            >
              {w.short}
            </span>
          ))}
          {calendarDays(view).map((d) => {
            const selected = d === value;
            return (
              <button
                key={d}
                type="button"
                disabled={!inRange(d, min, max)}
                onClick={() => pick(d)}
                aria-label={formatDate(d)}
                aria-pressed={selected}
                className={cn(
                  pickerCellClass(selected),
                  "size-9",
                  !d.startsWith(view) && !selected && "text-muted-foreground",
                  d === today && !selected && "ring-primary/50 ring-1",
                )}
              >
                {Number(d.slice(8))}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between gap-2 border-t pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!inRange(today, min, max)}
            onClick={() => pick(today)}
          >
            Bugun
          </Button>
          {clearable && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => pick("")}
            >
              Tozalash
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function MonthPicker({
  value,
  onChange,
  max,
  placeholder = "Oyni tanlang",
  className,
  invalid,
  ...props
}: PickerProps & {
  value: string;
  onChange: (value: string) => void;
  /** "2026-10" */
  max?: string;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() =>
    Number((value || todayInTashkent()).slice(0, 4)),
  );
  const maxYear = max ? Number(max.slice(0, 4)) : null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setYear(Number((value || todayInTashkent()).slice(0, 4)));
        setOpen(next);
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            data-invalid={invalid || undefined}
            className={cn(PICKER_TRIGGER_CLASS, className)}
            {...props}
          />
        }
      >
        <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
        <span
          className={cn("flex-1 truncate", !value && "text-muted-foreground")}
        >
          {value ? formatMonth(value) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-2">
        <div className="flex items-center justify-between gap-2">
          <NavButton dir="prev" onClick={() => setYear(year - 1)} />
          <span className="text-sm font-medium tabular-nums">{year}</span>
          <NavButton
            dir="next"
            disabled={maxYear !== null && year >= maxYear}
            onClick={() => setYear(year + 1)}
          />
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((name, i) => {
            const month = `${year}-${String(i + 1).padStart(2, "0")}`;
            const selected = month === value;
            return (
              <button
                key={month}
                type="button"
                disabled={!!max && month > max}
                onClick={() => {
                  onChange(month);
                  setOpen(false);
                }}
                aria-pressed={selected}
                className={cn(pickerCellClass(selected), "h-9")}
              >
                {name}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
