"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteTemplate,
  saveTemplateAction,
} from "@/app/(teacher)/teacher/templates/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
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
import {
  DEFAULT_TEMPLATE,
  KIND_LABEL,
  passScore,
  rulesSummary,
  type CategoryDraft,
  type GradeKind,
} from "@/lib/grades";
import {
  GRADE_KIND_VALUES,
  templateSchema,
  type TemplateInput,
} from "@/lib/validators/grades";

export type TemplateRow = TemplateInput & {
  id: string;
  /** Shu shablondan yaratilgan semestrlar soni */
  semesterCount: number;
};

const NEW_CATEGORY: CategoryDraft = {
  name: "",
  kind: "ASSIGNMENT",
  cap: 10,
  itemMin: 0,
  itemMax: 10,
  step: 0.5,
};

/** Bo'sh maydon — null (chegarasiz), aks holda son */
const nullableNumber = (v: unknown) =>
  v === "" || v === null || v === undefined ? null : Number(v);

/** Sozlamalar → Baholash shablonlari: ro'yxat, qo'shish, tahrirlash, o'chirish */
export function TemplatesSection({ templates }: { templates: TemplateRow[] }) {
  const [editing, setEditing] = useState<TemplateRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<TemplateRow | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button onClick={() => setEditing("new")}>
          <PlusIcon />
          Shablon qo&apos;shish
        </Button>
      </div>
      <ul className="flex flex-col gap-3">
        {templates.map((t) => (
          <li
            key={t.id}
            className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex items-center gap-2 font-medium">
                {t.name}
                {t.isDefault && <Badge variant="secondary">Asosiy</Badge>}
              </span>
              <span className="text-muted-foreground text-sm">
                Jami {t.maxTotal}, o&apos;tish {passScore(t)}, yiqilish{" "}
                {t.failBelow} dan kam · {t.semesterCount} ta semestr
              </span>
              <span className="text-muted-foreground text-xs">
                {rulesSummary({
                  ...t,
                  categories: t.categories.map((c) => ({
                    ...c,
                    cap: c.cap ?? null,
                  })),
                })}
              </span>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`${t.name}: tahrirlash`}
                onClick={() => setEditing(t)}
              >
                <PencilIcon />
              </Button>
              {templates.length > 1 && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${t.name}: o'chirish`}
                  onClick={() => setDeleting(t)}
                >
                  <Trash2Icon />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Yangi shablon" : "Shablonni tahrirlash"}
            </DialogTitle>
            <DialogDescription>
              O&apos;zgarishlar faqat keyin yaratiladigan semestrlarga
              ta&apos;sir qiladi: mavjud semestrlarda qoidalar nusxasi
              saqlanadi.
            </DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <TemplateForm
              template={editing === "new" ? null : editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {deleting && (
        <ConfirmAction
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Shablonni o'chirish"
          description={`"${deleting.name}" o'chadi. Undan yaratilgan semestrlar o'z qoidalari bilan qoladi.`}
          confirmLabel="O'chirish"
          destructive
          action={() => deleteTemplate(deleting.id)}
        />
      )}
    </div>
  );
}

function TemplateForm({
  template,
  onDone,
}: {
  template: TemplateRow | null;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaultValues: TemplateInput = template
    ? {
        name: template.name,
        maxTotal: template.maxTotal,
        passPercent: template.passPercent,
        failBelow: template.failBelow,
        extraMode: template.extraMode,
        extraBeyondMax: template.extraBeyondMax,
        isDefault: template.isDefault,
        categories: template.categories,
      }
    : { ...DEFAULT_TEMPLATE, name: "", isDefault: false };
  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues,
  });
  const { errors } = form.formState;
  const categories = useFieldArray({
    control: form.control,
    name: "categories",
  });
  const kinds = useWatch({ control: form.control, name: "categories" });

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await saveTemplateAction(template?.id ?? null, values);
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
      <FormField id="tpl-name" label="Nomi" error={errors.name?.message}>
        <Input
          id="tpl-name"
          maxLength={60}
          placeholder="Asosiy"
          aria-invalid={!!errors.name}
          {...form.register("name")}
        />
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField
          id="tpl-max"
          label="Jami ball"
          error={errors.maxTotal?.message}
        >
          <Input
            id="tpl-max"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.maxTotal}
            {...form.register("maxTotal", { valueAsNumber: true })}
          />
        </FormField>
        <FormField
          id="tpl-pass"
          label="O'tish (%)"
          error={errors.passPercent?.message}
        >
          <Input
            id="tpl-pass"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.passPercent}
            {...form.register("passPercent", { valueAsNumber: true })}
          />
        </FormField>
        <FormField
          id="tpl-fail"
          label="Yiqilish (dan kam)"
          error={errors.failBelow?.message}
        >
          <Input
            id="tpl-fail"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.failBelow}
            {...form.register("failBelow", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <FormField
        id="tpl-extra"
        label="Qo'shimcha ball kimga"
        error={errors.extraMode?.message}
      >
        <NativeSelect id="tpl-extra" {...form.register("extraMode")}>
          <NativeSelectOption value="ANYTIME">
            Istalgan vaqtda, istalgan o&apos;quvchiga
          </NativeSelectOption>
          <NativeSelectOption value="AFTER_END_BAND">
            Semestr tugagach, o&apos;tolmaganlarga (yiqilishdan yuqori)
          </NativeSelectOption>
        </NativeSelect>
      </FormField>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary mt-0.5 size-4"
          {...form.register("extraBeyondMax")}
        />
        <span>
          Jami ball qo&apos;shimcha ball hisobiga oshishi mumkin
          <span className="text-muted-foreground block text-xs">
            Belgilanmasa, jami hech qachon &quot;Jami ball&quot;dan oshmaydi.
          </span>
        </span>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary size-4"
          {...form.register("isDefault")}
        />
        Asosiy shablon (yangi semestrda oldindan tanlanadi)
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Kategoriyalar</legend>
        <p className="text-muted-foreground text-xs">
          Chegara bo&apos;sh — chegarasiz. Har bir topshiriq (og&apos;zaki — har
          dars) uchun ball oralig&apos;i va qadami.
        </p>
        <FormError message={errors.categories?.message} />
        {categories.fields.map((field, i) => {
          const e = errors.categories?.[i];
          const kind = (kinds?.[i]?.kind ?? field.kind) as GradeKind;
          return (
            <div
              key={field.id}
              className="flex flex-col gap-2 rounded-md border p-3"
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input
                  aria-label="Kategoriya nomi"
                  placeholder="Nomi"
                  maxLength={40}
                  aria-invalid={!!e?.name}
                  {...form.register(`categories.${i}.name`)}
                />
                <NativeSelect
                  aria-label="Turi"
                  aria-invalid={!!e?.kind}
                  {...form.register(`categories.${i}.kind`)}
                >
                  {GRADE_KIND_VALUES.map((k) => (
                    <NativeSelectOption key={k} value={k}>
                      {KIND_LABEL[k]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Yuqoriga"
                    disabled={i === 0}
                    onClick={() => categories.move(i, i - 1)}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Pastga"
                    disabled={i === categories.fields.length - 1}
                    onClick={() => categories.move(i, i + 1)}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="O'chirish"
                    onClick={() => categories.remove(i)}
                  >
                    <XIcon />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="flex flex-col gap-1 text-xs">
                  Chegara
                  <Input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    placeholder="chegarasiz"
                    aria-invalid={!!e?.cap}
                    {...form.register(`categories.${i}.cap`, {
                      setValueAs: nullableNumber,
                    })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Eng kam
                  <Input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    readOnly={kind === "ORAL"}
                    aria-invalid={!!e?.itemMin}
                    {...form.register(`categories.${i}.itemMin`, {
                      valueAsNumber: true,
                    })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Eng ko&apos;p
                  <Input
                    type="number"
                    inputMode="numeric"
                    readOnly={kind === "ORAL"}
                    aria-invalid={!!e?.itemMax}
                    {...form.register(`categories.${i}.itemMax`, {
                      valueAsNumber: true,
                    })}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  Qadam
                  <NativeSelect
                    {...form.register(`categories.${i}.step`, {
                      setValueAs: (v) => Number(v),
                    })}
                  >
                    <NativeSelectOption value="0.5">0,5</NativeSelectOption>
                    <NativeSelectOption value="1">1</NativeSelectOption>
                  </NativeSelect>
                </label>
              </div>
              <FormError
                message={
                  e?.name?.message ??
                  e?.kind?.message ??
                  e?.cap?.message ??
                  e?.itemMin?.message ??
                  e?.itemMax?.message ??
                  e?.step?.message
                }
              />
            </div>
          );
        })}
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => categories.append(NEW_CATEGORY)}
          >
            <PlusIcon />
            Kategoriya qo&apos;shish
          </Button>
        </div>
      </fieldset>

      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
