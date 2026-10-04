"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MoreHorizontalIcon } from "lucide-react";
import {
  deleteGroup,
  renameGroup,
} from "@/app/(teacher)/teacher/groups/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { FormError } from "@/components/common/form-field";
import { applyServerErrors } from "@/components/common/form-errors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { groupFormSchema } from "@/lib/validators/student";

export function GroupRowActions({
  group,
}: {
  group: { id: string; name: string; studentCount: number };
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${group.name}: amallar`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            Nomini o&apos;zgartirish
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            O&apos;chirish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guruh nomini o&apos;zgartirish</DialogTitle>
          </DialogHeader>
          <RenameForm group={group} onDone={() => setRenameOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmAction
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`"${group.name}" guruhini o'chirish`}
        description={
          group.studentCount > 0
            ? `Guruhda ${group.studentCount} ta o'quvchi bor — avval ularni boshqa guruhga o'tkazing.`
            : "Guruh testlardan ham uziladi. Bu amalni qaytarib bo'lmaydi."
        }
        confirmLabel="O'chirish"
        destructive
        action={() => deleteGroup(group.id)}
      />
    </>
  );
}

function RenameForm({
  group,
  onDone,
}: {
  group: { id: string; name: string };
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: group.name },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await renameGroup(group.id, values);
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
      <Input
        aria-label="Guruh nomi"
        aria-invalid={!!errors.name}
        maxLength={64}
        autoFocus
        {...form.register("name")}
      />
      <FormError
        message={errors.name?.message ?? errors.root?.server?.message}
      />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
