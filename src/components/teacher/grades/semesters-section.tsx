"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  createSemester,
  deleteSemester,
  updateSemester,
} from "@/app/(teacher)/teacher/grades/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { DatePicker } from "@/components/common/date-picker";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { passScore, rulesSummary, type SemesterRules } from "@/lib/grades";
import { formatDate, type DateStr } from "@/lib/time";
import { semesterSchema, type SemesterInput } from "@/lib/validators/grades";

export type SemesterRow = {
  id: string;
  name: string;
  startDate: DateStr;
  endDate: DateStr;
  closed: boolean;
  ended: boolean;
  /** Semestrning o'z nusxasi (shablondan) — tahrirlanmaydi */
  rules: SemesterRules;
  assignmentCount: number;
};

export type TemplateOption = { id: string; name: string; isDefault: boolean };

/** Guruh sahifasida: semestrlar ro'yxati, qo'shish (shablondan), tahrirlash, yopish, o'chirish */
export function SemestersSection({
  groupId,
  semesters,
  templates,
}: {
  groupId: string;
  semesters: SemesterRow[];
  templates: TemplateOption[];
}) {
  const [editing, setEditing] = useState<SemesterRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<SemesterRow | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Semestrlar</h2>
        <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
          <PlusIcon />
          Semestr qo&apos;shish
        </Button>
      </div>
      {semesters.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Semestr yo&apos;q. Uyga vazifa va ballar uchun avval semestr
          qo&apos;shing.
        </p>
      ) : (
        <ul className="flex flex-col divide-y text-sm">
          {semesters.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-2 font-medium">
                  {s.name}
                  {s.closed ? (
                    <Badge variant="secondary">
                      <LockIcon />
                      Yopilgan
                    </Badge>
                  ) : (
                    s.ended && <Badge variant="secondary">Tugagan</Badge>
                  )}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatDate(s.startDate)} – {formatDate(s.endDate)} · jami{" "}
                  {s.rules.maxTotal}, o&apos;tish {passScore(s.rules)} ·{" "}
                  {s.assignmentCount} ta topshiriq
                </span>
                <span className="text-muted-foreground text-xs">
                  {rulesSummary(s.rules)}
                </span>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${s.name}: tahrirlash`}
                  onClick={() => setEditing(s)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${s.name}: o'chirish`}
                  onClick={() => setDeleting(s)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Yangi semestr" : "Semestrni tahrirlash"}
            </DialogTitle>
            <DialogDescription>
              {editing === "new"
                ? "Ball qoidalari tanlangan shablondan semestrga nusxalanadi: shablon keyin o'zgarsa ham bu semestr o'zgarmaydi."
                : "Ball qoidalari semestr yaratilganda shablondan olingan va o'zgarmaydi."}
            </DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <SemesterForm
              groupId={groupId}
              semester={editing === "new" ? null : editing}
              templates={templates}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {deleting && (
        <ConfirmAction
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Semestrni o'chirish"
          description={`"${deleting.name}" semestri bilan birga uning ${deleting.assignmentCount} ta topshirig'i, qo'yilgan ballar va tuzatishlar o'chadi. Og'zaki ballar darslarda qoladi.`}
          confirmLabel="O'chirish"
          destructive
          action={() => deleteSemester(deleting.id)}
        />
      )}
    </div>
  );
}

function SemesterForm({
  groupId,
  semester,
  templates,
  onDone,
}: {
  groupId: string;
  semester: SemesterRow | null;
  templates: TemplateOption[];
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaultValues: SemesterInput = semester
    ? {
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate,
        closed: semester.closed,
        templateId: null,
      }
    : {
        name: "",
        startDate: "",
        endDate: "",
        closed: false,
        templateId: (templates.find((t) => t.isDefault) ?? templates[0])?.id,
      };
  const form = useForm({
    resolver: zodResolver(semesterSchema),
    defaultValues,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = semester
        ? await updateSemester(semester.id, values)
        : await createSemester(groupId, values);
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="semester-name" label="Nomi" error={errors.name?.message}>
        <Input
          id="semester-name"
          maxLength={60}
          placeholder="1-semestr"
          aria-invalid={!!errors.name}
          {...form.register("name")}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField
          id="semester-start"
          label="Boshlanishi"
          error={errors.startDate?.message}
        >
          <Controller
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <DatePicker
                id="semester-start"
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.startDate}
              />
            )}
          />
        </FormField>
        <FormField
          id="semester-end"
          label="Tugashi"
          error={errors.endDate?.message}
        >
          <Controller
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <DatePicker
                id="semester-end"
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.endDate}
              />
            )}
          />
        </FormField>
      </div>

      {semester ? (
        <p className="text-muted-foreground text-sm">
          {rulesSummary(semester.rules)}
        </p>
      ) : (
        <FormField
          id="semester-template"
          label="Baholash shabloni"
          error={errors.templateId?.message}
        >
          <NativeSelect
            id="semester-template"
            aria-invalid={!!errors.templateId}
            {...form.register("templateId")}
          >
            {templates.map((t) => (
              <NativeSelectOption key={t.id} value={t.id}>
                {t.name}
                {t.isDefault ? " (asosiy)" : ""}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Link
            prefetch={false}
            href="/teacher/templates"
            className="text-muted-foreground text-xs underline"
          >
            Shablonlarni sozlash
          </Link>
        </FormField>
      )}

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary mt-0.5 size-4"
          {...form.register("closed")}
        />
        <span>
          Semestr yopilgan
          <span className="text-muted-foreground block text-xs">
            Muddatidan oldin yopish. Yopilgach yakuniy holat chiqadi.
          </span>
        </span>
      </label>

      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
