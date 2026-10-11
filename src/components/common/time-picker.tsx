"use client";

import { useState } from "react";
import { ClockIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PICKER_TRIGGER_CLASS,
  pickerCellClass,
  type PickerProps,
} from "./date-picker";

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);

/** Vaqt tanlash ("14:00"): soat va daqiqa (5 daqiqa qadam) ustunlari */
export function TimePicker({
  value,
  onChange,
  placeholder = "--:--",
  className,
  invalid,
  ...props
}: PickerProps & {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hour, minute] = value ? value.split(":") : ["", ""];

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <ClockIcon className="text-muted-foreground size-4 shrink-0" />
        <span
          className={cn(
            "flex-1 tabular-nums",
            !value && "text-muted-foreground",
          )}
        >
          {value || placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-1.5">
        <div className="flex gap-1.5">
          <Column
            label="Soat"
            items={HOURS}
            selected={hour}
            onPick={(h) => onChange(`${h}:${minute || "00"}`)}
          />
          <Column
            label="Daqiqa"
            items={MINUTES}
            selected={minute}
            onPick={(m) => {
              onChange(`${hour || "08"}:${m}`);
              setOpen(false);
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Column({
  label,
  items,
  selected,
  onPick,
}: {
  label: string;
  items: string[];
  selected: string;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground px-1 text-center text-xs font-medium">
        {label}
      </span>
      <div
        role="listbox"
        aria-label={label}
        className="relative flex h-56 flex-col gap-0.5 overflow-y-auto pr-0.5"
      >
        {items.map((item) => (
          <button
            key={item}
            type="button"
            role="option"
            aria-selected={item === selected}
            // Ochilganda tanlangan qiymat ko'rinadigan joyga suriladi
            ref={(el) => {
              const list = el?.parentElement;
              if (el && list && item === selected)
                list.scrollTop =
                  el.offsetTop - (list.clientHeight - el.clientHeight) / 2;
            }}
            onClick={() => onPick(item)}
            className={cn(pickerCellClass(item === selected), "h-8 w-12")}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
