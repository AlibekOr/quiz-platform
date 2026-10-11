"use client";

import { useState } from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  addMonths,
  calendarDays,
  formatMonth,
  MONTHS,
  parseDateInput,
  todayInTashkent,
  WEEKDAYS,
  type DateStr,
} from "@/lib/time";
import { cn } from "@/lib/utils";

// Sana tanlash: kalendar oynasi (oy, qo'lda kiritish, "Bugun", "Bekor qilish" / "Tanlash").
// Kunlar ustuni qat'iy kenglikda (repeat(7,2.5rem)) — Safari'da ham 7 ustun bo'lib turadi.
// Qiymatlar matn: "2026-10-04"; bo'sh qiymat — "" (tanlanmagan)

export type PickerProps = {
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  placeholder?: string;
};

/** Input bilan bir xil ko'rinadigan tugma (vaqt tanlashda ham ishlatiladi) */
export const PICKER_TRIGGER_CLASS =
  "border-input focus-visible:border-ring focus-visible:ring-ring/50 data-invalid:border-destructive data-invalid:ring-destructive/20 dark:bg-input/30 dark:data-invalid:border-destructive/50 dark:data-invalid:ring-destructive/40 flex h-8 w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg border bg-transparent px-2.5 text-left text-base font-medium tabular-nums transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-invalid:ring-3 md:text-sm";

/** "2026-10-11" -> "11 okt 2026" (maydonda) */
function formatShort(date: DateStr): string {
  const month = MONTHS[Number(date.slice(5, 7)) - 1] ?? "?";
  return `${Number(date.slice(8))} ${month.slice(0, 3).toLowerCase()} ${date.slice(0, 4)}`;
}

/** "2026-10-11" -> "11/10/2026" (qo'lda kiritish maydonida) */
function formatInput(date: DateStr | ""): string {
  return date
    ? `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`
    : "";
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
  disabled,
  ...props
}: PickerProps & {
  value: string;
  onChange: (value: DateStr | "") => void;
  min?: DateStr;
  max?: DateStr;
  /** "Tozalash" tugmasi (ixtiyoriy maydonlar uchun) */
  clearable?: boolean;
}) {
  const today = todayInTashkent();
  const [open, setOpen] = useState(false);
  // Oyna ichidagi tanlov: "Tanlash" bosilgandagina onChange
  const [draft, setDraft] = useState<DateStr | "">(value);
  const [view, setView] = useState(() => (value || today).slice(0, 7));
  const [text, setText] = useState(() => formatInput(value));

  function select(date: DateStr) {
    setDraft(date);
    setView(date.slice(0, 7));
    setText(formatInput(date));
  }

  function openChange(next: boolean) {
    if (next) {
      // Har ochilganda saqlangan qiymatdan boshlanadi (bo'lmasa bugun yoki max oyi)
      const start = value || (max && today > max ? max : today);
      setDraft(value);
      setView(start.slice(0, 7));
      setText(formatInput(value));
    }
    setOpen(next);
  }

  function typed(next: string) {
    setText(next);
    const date = parseDateInput(next);
    if (date && inRange(date, min, max)) {
      setDraft(date);
      setView(date.slice(0, 7));
    }
  }

  function apply() {
    if (draft && inRange(draft, min, max)) onChange(draft);
    setOpen(false);
  }

  const textInvalid = text !== "" && text !== formatInput(draft);

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={openChange}>
        <PopoverTrigger
          render={
            <button
              type="button"
              disabled={disabled}
              data-invalid={invalid || undefined}
              className={cn(PICKER_TRIGGER_CLASS, clearable && value && "pr-8")}
              {...props}
            />
          }
        >
          <CalendarIcon className="text-muted-foreground size-4 shrink-0" />
          <span
            className={cn(
              "flex-1 truncate",
              !value && "text-muted-foreground font-normal",
            )}
          >
            {value ? formatShort(value) : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto gap-4 rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Oldingi oy"
              disabled={!!min && addMonths(view, -1) < min.slice(0, 7)}
              onClick={() => setView(addMonths(view, -1))}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="text-sm font-semibold">{formatMonth(view)}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Keyingi oy"
              disabled={!!max && addMonths(view, 1) > max.slice(0, 7)}
              onClick={() => setView(addMonths(view, 1))}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              aria-label="Sana (kk/oo/yyyy)"
              inputMode="numeric"
              placeholder="kk/oo/yyyy"
              value={text}
              aria-invalid={textInvalid || undefined}
              onChange={(e) => typed(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  apply();
                }
              }}
              className="h-9 flex-1 tabular-nums"
            />
            <Button
              type="button"
              variant="outline"
              className="h-9 font-semibold"
              disabled={!inRange(today, min, max)}
              onClick={() => select(today)}
            >
              Bugun
            </Button>
          </div>

          <div className="grid grid-cols-[repeat(7,2.5rem)] justify-center gap-y-1 text-center">
            {WEEKDAYS.map((w) => (
              <span
                key={w.value}
                className="text-muted-foreground py-1.5 text-xs font-medium"
              >
                {w.short}
              </span>
            ))}
            {calendarDays(view).map((d) => {
              const selected = d === draft;
              const outside = !d.startsWith(view);
              return (
                <button
                  key={d}
                  type="button"
                  disabled={!inRange(d, min, max)}
                  onClick={() => select(d)}
                  aria-label={formatShort(d)}
                  aria-pressed={selected}
                  className={cn(
                    "focus-visible:ring-ring/50 relative mx-auto flex size-10 items-center justify-center rounded-full text-sm tabular-nums transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-30",
                    selected
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-muted",
                    outside && !selected && "text-muted-foreground/60",
                  )}
                >
                  {Number(d.slice(8))}
                  {d === today && (
                    <span
                      className={cn(
                        "absolute bottom-1.5 size-1 rounded-full",
                        selected ? "bg-primary-foreground" : "bg-primary",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="-mx-4 grid grid-cols-2 gap-3 border-t px-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 font-semibold"
              onClick={() => setOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              className="h-10 font-semibold"
              disabled={!draft || !inRange(draft, min, max)}
              onClick={apply}
            >
              Tanlash
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled && (
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
