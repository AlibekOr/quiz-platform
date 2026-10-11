"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCheckIcon, MessageSquareTextIcon, PhoneIcon } from "lucide-react";
import { toast } from "sonner";
import { saveAttendance } from "@/app/(teacher)/teacher/attendance/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MARK_LABEL, type AttendanceMark } from "@/lib/attendance";
import { formatPhone } from "@/lib/students/format";
import { cn } from "@/lib/utils";
import {
  attendanceFormSchema,
  type AttendanceFormInput,
} from "@/lib/validators/attendance";

export type SheetStudent = {
  studentId: string;
  fullName: string;
  status: AttendanceMark | null;
  note: string | null;
  parentName: string | null;
  parentPhone: string | null;
  formerMember: boolean;
  oral: number | null;
};

/** Og'zaki savol-javob bali: 0 / 0.5 / 1 (qayta bosilsa — olib tashlanadi) */
const ORAL_VALUES = [
  { value: "0", label: "0" },
  { value: "0.5", label: "0,5" },
  { value: "1", label: "1" },
] as const;
type OralValue = (typeof ORAL_VALUES)[number]["value"];

const MARKS: { value: AttendanceMark; active: string }[] = [
  {
    value: "PRESENT",
    active:
      "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600/90",
  },
  {
    value: "ABSENT",
    active:
      "border-destructive bg-destructive text-white hover:bg-destructive/90",
  },
  {
    value: "LATE",
    active: "border-amber-500 bg-amber-500 text-white hover:bg-amber-500/90",
  },
];

export function AttendanceSheet({
  groupId,
  date,
  topic,
  students,
}: {
  groupId: string;
  date: string;
  topic: string | null;
  students: SheetStudent[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openNotes, setOpenNotes] = useState(
    () => new Set(students.filter((s) => s.note).map((s) => s.studentId)),
  );

  const defaultValues: AttendanceFormInput = {
    topic: topic ?? "",
    records: students.map((s) => ({
      studentId: s.studentId,
      status: s.status ?? "",
      note: s.note ?? "",
      oral: s.oral === null ? "" : (String(s.oral) as OralValue),
    })),
  };
  const form = useForm({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues,
  });
  const records = useWatch({ control: form.control, name: "records" });
  const { errors } = form.formState;

  const count = (status: string) =>
    records.filter((r) => r.status === status).length;
  const unmarked = count("");

  function mark(index: number, status: AttendanceMark) {
    form.setValue(`records.${index}.status`, status, { shouldDirty: true });
    // Kelmagan o'quvchiga og'zaki ball qo'yilmaydi
    if (status === "ABSENT")
      form.setValue(`records.${index}.oral`, "", { shouldDirty: true });
    // "N ta belgilanmagan" — ro'yxat darajasidagi xato, shuning uchun butun forma qayta tekshiriladi
    if (form.formState.isSubmitted) void form.trigger();
  }

  function markAllPresent() {
    records.forEach((_, i) => mark(i, "PRESENT"));
  }

  // Server Zod bilan qayta tekshiradi — xom (kiritilgan) qiymatlar yuboriladi
  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const result = await saveAttendance(groupId, date, form.getValues());
      if (result.ok) {
        toast.success(result.message);
        // Darsga uyga vazifa berilmagan bo'lsa, ro'yxat sahifasida taklif chiqadi
        router.push(`/teacher/attendance?date=${date}&homework=${groupId}`);
      } else {
        applyServerErrors(form, result);
        toast.error(result.error);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 pb-24" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="topic">Dars mavzusi (ixtiyoriy)</Label>
        <Input id="topic" maxLength={200} {...form.register("topic")} />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11"
        onClick={markAllPresent}
      >
        <CheckCheckIcon />
        Hammasi keldi
      </Button>

      <ul className="flex flex-col gap-2">
        {students.map((s, i) => {
          const status = records[i]?.status;
          const noteOpen = openNotes.has(s.studentId);
          return (
            <li
              key={s.studentId}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3",
                status === "" &&
                  form.formState.isSubmitted &&
                  "border-destructive/60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 font-medium break-words">
                  {i + 1}. {s.fullName}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                  {s.formerMember && (
                    <Badge variant="outline">Guruhda emas</Badge>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${s.fullName}: izoh`}
                    aria-pressed={noteOpen}
                    onClick={() =>
                      setOpenNotes((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.studentId)) next.delete(s.studentId);
                        else next.add(s.studentId);
                        return next;
                      })
                    }
                  >
                    <MessageSquareTextIcon />
                  </Button>
                </div>
              </div>
              <div
                role="radiogroup"
                aria-label={`${s.fullName}: davomat`}
                className="grid grid-cols-3 gap-2"
              >
                {MARKS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={status === m.value}
                    onClick={() => mark(i, m.value)}
                    className={cn(
                      "hover:bg-muted h-11 rounded-md border text-sm font-medium transition-colors",
                      status === m.value && m.active,
                    )}
                  >
                    {MARK_LABEL[m.value]}
                  </button>
                ))}
              </div>
              {status !== "ABSENT" && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Og&apos;zaki:
                  </span>
                  <div
                    role="radiogroup"
                    aria-label={`${s.fullName}: og'zaki ball`}
                    className="flex gap-1"
                  >
                    {ORAL_VALUES.map((o) => {
                      const checked = records[i]?.oral === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          onClick={() =>
                            form.setValue(
                              `records.${i}.oral`,
                              checked ? "" : o.value,
                              { shouldDirty: true },
                            )
                          }
                          className={cn(
                            "hover:bg-muted h-9 w-11 rounded-md border text-sm font-medium tabular-nums transition-colors",
                            checked &&
                              "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                          )}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {status === "ABSENT" && s.parentPhone && (
                <a
                  href={`tel:${s.parentPhone}`}
                  className="text-primary flex items-center gap-2 text-sm font-medium hover:underline"
                >
                  <PhoneIcon className="size-4" />
                  {s.parentName ?? "Ota-onasi"}: {formatPhone(s.parentPhone)}
                </a>
              )}
              {noteOpen && (
                <Input
                  aria-label={`${s.fullName}: izoh matni`}
                  placeholder="Izoh (masalan, sababi)"
                  maxLength={200}
                  {...form.register(`records.${i}.note`)}
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur md:left-60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm">
            <span className="text-emerald-700 dark:text-emerald-400">
              Keldi {count("PRESENT") + count("LATE")}
            </span>
            {" · "}
            <span className="text-destructive">Kelmadi {count("ABSENT")}</span>
            {unmarked > 0 && (
              <span className="text-muted-foreground">
                {" "}
                · belgilanmagan {unmarked}
              </span>
            )}
            <FormError
              message={
                errors.records?.root?.message ??
                errors.records?.message ??
                errors.root?.server?.message
              }
            />
          </div>
          <Button type="submit" className="h-11 px-6" disabled={pending}>
            {pending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </div>
    </form>
  );
}
