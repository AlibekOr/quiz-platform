"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  createPenaltyType,
  deletePenaltyType,
  updatePenaltyType,
} from "@/app/(teacher)/teacher/penalties/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPoints } from "@/lib/grades";
import {
  penaltyTypeSchema,
  type PenaltyTypeInput,
} from "@/lib/validators/penalties";

export type PenaltyTypeRow = {
  id: string;
  name: string;
  defaultPoints: number;
  description: string | null;
  isActive: boolean;
  usedCount: number;
};

/** Jarima shablonlari: qo'shish, tahrirlash, nofaol qilish, o'chirish (ishlatilmagan bo'lsa) */
export function PenaltyTypesSection({ types }: { types: PenaltyTypeRow[] }) {
  const [editing, setEditing] = useState<PenaltyTypeRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<PenaltyTypeRow | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button onClick={() => setEditing("new")}>
          <PlusIcon />
          Shablon qo&apos;shish
        </Button>
      </div>
      {types.length === 0 ? (
        <p className="text-muted-foreground">Shablon yo&apos;q.</p>
      ) : (
        <ul className="divide-y rounded-lg border text-sm">
          {types.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 p-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {t.name}
                  <span className="text-destructive tabular-nums">
                    −{formatPoints(t.defaultPoints)}
                  </span>
                  {!t.isActive && <Badge variant="secondary">Nofaol</Badge>}
                </span>
                <span className="text-muted-foreground text-xs">
                  {t.description ? `${t.description} · ` : ""}
                  {t.usedCount} marta qo&apos;yilgan
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
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`${t.name}: o'chirish`}
                  onClick={() => setDeleting(t)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Yangi shablon" : "Shablonni tahrirlash"}
            </DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <PenaltyTypeForm
              type={editing === "new" ? null : editing}
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
          description={
            deleting.usedCount > 0
              ? `"${deleting.name}" ${deleting.usedCount} ta jarimada ishlatilgan, uni o'chirib bo'lmaydi. Tahrirlashda "Faol" belgisini olib tashlang.`
              : `"${deleting.name}" o'chadi.`
          }
          confirmLabel="O'chirish"
          destructive
          action={() => deletePenaltyType(deleting.id)}
        />
      )}
    </div>
  );
}

function PenaltyTypeForm({
  type,
  onDone,
}: {
  type: PenaltyTypeRow | null;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const defaultValues: PenaltyTypeInput = type
    ? {
        name: type.name,
        defaultPoints: type.defaultPoints,
        description: type.description ?? "",
        isActive: type.isActive,
      }
    : { name: "", defaultPoints: 1, description: "", isActive: true };
  const form = useForm({
    resolver: zodResolver(penaltyTypeSchema),
    defaultValues,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = type
        ? await updatePenaltyType(type.id, values)
        : await createPenaltyType(values);
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
      <FormField id="pt-name" label="Nomi" error={errors.name?.message}>
        <Input
          id="pt-name"
          maxLength={100}
          placeholder="Darsga kechikish"
          aria-invalid={!!errors.name}
          {...form.register("name")}
        />
      </FormField>
      <FormField
        id="pt-points"
        label="Ball (ayiriladi)"
        error={errors.defaultPoints?.message}
      >
        <Input
          id="pt-points"
          type="number"
          inputMode="decimal"
          min={0.5}
          step={0.5}
          className="w-28"
          aria-invalid={!!errors.defaultPoints}
          {...form.register("defaultPoints", { valueAsNumber: true })}
        />
      </FormField>
      <FormField
        id="pt-description"
        label="Tavsif (ixtiyoriy)"
        error={errors.description?.message}
      >
        <Input
          id="pt-description"
          maxLength={300}
          {...form.register("description")}
        />
      </FormField>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary size-4"
          {...form.register("isActive")}
        />
        Faol (jarima qo&apos;yishda tanlanadi)
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
