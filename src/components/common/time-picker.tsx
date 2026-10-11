"use client";

import { useRef, useState } from "react";
import { ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  formatTime,
  hourMarks,
  minuteMarks,
  parseTime,
  pointToValue,
  valuePosition,
  type ClockMode,
} from "@/lib/clock";
import { cn } from "@/lib/utils";
import { PICKER_TRIGGER_CLASS, type PickerProps } from "./date-picker";

// Vaqt tanlash ("14:00"): soat siferblati oynasi, 24 soatlik (tashqi halqa 1–12,
// ichki 13–00). Avval soat, keyin daqiqa (5 daqiqa qadam); bosib yoki sudrab tanlanadi.
// Asosiy o'lchamlar inline stilda: dev rejimida Safari yangi Tailwind klasslarini
// keshdan olmay qolsa ham siferblat buzilmaydi

const DIAL = 216;
const CENTER = DIAL / 2;
/** Tashqi halqa radiusi (px) */
const RADIUS = 84;
const STEP = 5;

function Dial({
  mode,
  value,
  onChange,
  onDone,
}: {
  mode: ClockMode;
  value: number;
  onChange: (value: number) => void;
  /** Barmoq qo'yib yuborilganda (soatdan keyin daqiqaga o'tish) */
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function update(e: React.PointerEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const scale = (rect.width / DIAL) * RADIUS;
    const x = (e.clientX - rect.left - rect.width / 2) / scale;
    const y = (e.clientY - rect.top - rect.height / 2) / scale;
    onChange(pointToValue(mode, x, y, STEP));
  }

  function keyDown(e: React.KeyboardEvent) {
    const delta =
      e.key === "ArrowUp" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowDown" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (delta) {
      e.preventDefault();
      onChange(
        mode === "hour"
          ? (value + delta + 24) % 24
          : (value + delta * STEP + 60) % 60,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      onDone();
    }
  }

  const marks = mode === "hour" ? hourMarks() : minuteMarks();
  const tip = valuePosition(mode, value);
  const tipX = CENTER + tip.x * RADIUS;
  const tipY = CENTER + tip.y * RADIUS;
  const inner = mode === "hour" && (value === 0 || value > 12);

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={mode === "hour" ? "Soat" : "Daqiqa"}
      aria-valuemin={0}
      aria-valuemax={mode === "hour" ? 23 : 59}
      aria-valuenow={value}
      onKeyDown={keyDown}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e);
      }}
      onPointerMove={(e) => {
        if (dragging.current) update(e);
      }}
      onPointerUp={() => {
        if (!dragging.current) return;
        dragging.current = false;
        onDone();
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
      style={{ width: DIAL, height: DIAL }}
      className="bg-muted focus-visible:ring-ring/50 relative mx-auto shrink-0 cursor-pointer touch-none rounded-full outline-none select-none focus-visible:ring-3"
    >
      <svg
        viewBox={`0 0 ${DIAL} ${DIAL}`}
        className="text-primary pointer-events-none absolute inset-0 size-full"
        aria-hidden
      >
        <line
          x1={CENTER}
          y1={CENTER}
          x2={tipX}
          y2={tipY}
          stroke="currentColor"
          strokeWidth={2}
        />
        <circle cx={CENTER} cy={CENTER} r={4} fill="currentColor" />
        <circle cx={tipX} cy={tipY} r={16} fill="currentColor" />
        {mode === "minute" && value % 5 !== 0 && (
          <circle
            cx={tipX}
            cy={tipY}
            r={3}
            className="fill-primary-foreground"
          />
        )}
      </svg>
      {marks.map((m) => {
        const isInner = Math.hypot(m.x, m.y) < 0.9;
        return (
          <span
            key={m.label}
            className={cn(
              "pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full tabular-nums",
              isInner ? "text-muted-foreground text-xs" : "text-sm",
              m.value === value &&
                (mode === "minute" || isInner === inner) &&
                "text-primary-foreground font-semibold",
            )}
            style={{
              left: CENTER + m.x * RADIUS,
              top: CENTER + m.y * RADIUS,
              width: 32,
              height: 32,
            }}
          >
            {m.label}
          </span>
        );
      })}
    </div>
  );
}

function Segment({
  active,
  label,
  value,
  onClick,
}: {
  active: boolean;
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        width: 72,
        height: 56,
        fontSize: "2.25rem",
        lineHeight: 1,
        backgroundColor: active
          ? "color-mix(in oklab, var(--primary) 15%, transparent)"
          : undefined,
      }}
      className={cn(
        "focus-visible:ring-ring/50 flex items-center justify-center rounded-xl tabular-nums transition-colors outline-none focus-visible:ring-3",
        active ? "text-primary" : "bg-muted text-foreground hover:bg-muted/70",
      )}
    >
      {String(value).padStart(2, "0")}
    </button>
  );
}

export function TimePicker({
  value,
  onChange,
  placeholder = "--:--",
  className,
  invalid,
  disabled,
  ...props
}: PickerProps & {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ClockMode>("hour");
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);

  function openChange(next: boolean) {
    if (next) {
      // Har ochilganda saqlangan qiymatdan, soat rejimida boshlanadi
      const parsed = parseTime(value);
      setHour(parsed?.hour ?? 12);
      setMinute(parsed?.minute ?? 0);
      setMode("hour");
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            data-invalid={invalid || undefined}
            className={cn(PICKER_TRIGGER_CLASS, className)}
            {...props}
          />
        }
      >
        <ClockIcon className="text-muted-foreground size-4 shrink-0" />
        <span
          className={cn(
            "flex-1 truncate",
            !value && "text-muted-foreground font-normal",
          )}
        >
          {value || placeholder}
        </span>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-auto gap-4 sm:max-w-none"
        style={{ padding: 20, borderRadius: 24 }}
      >
        <DialogTitle className="text-muted-foreground text-xs font-medium">
          Vaqtni tanlang
        </DialogTitle>
        <div className="flex items-center justify-center gap-2">
          <Segment
            label="Soat"
            active={mode === "hour"}
            value={hour}
            onClick={() => setMode("hour")}
          />
          <span style={{ fontSize: "2.25rem", lineHeight: 1 }}>:</span>
          <Segment
            label="Daqiqa"
            active={mode === "minute"}
            value={minute}
            onClick={() => setMode("minute")}
          />
        </div>
        <Dial
          mode={mode}
          value={mode === "hour" ? hour : minute}
          onChange={mode === "hour" ? setHour : setMinute}
          onDone={() => {
            if (mode === "hour") setMode("minute");
          }}
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-primary h-9 px-3 font-semibold"
            onClick={() => setOpen(false)}
          >
            Bekor qilish
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-primary h-9 px-3 font-semibold"
            onClick={() => {
              onChange(formatTime(hour, minute));
              setOpen(false);
            }}
          >
            Tanlash
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
