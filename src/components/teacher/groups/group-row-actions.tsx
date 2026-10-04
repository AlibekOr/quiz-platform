"use client";

import { useState } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { deleteGroup, renameGroup } from "@/app/teacher/groups/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { FormError } from "@/components/common/form-field";
import { formError, useFormAction } from "@/components/common/use-form-action";
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
  const [state, action, pending] = useFormAction(
    renameGroup.bind(null, group.id),
    onDone,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        name="name"
        defaultValue={group.name}
        aria-label="Guruh nomi"
        required
        maxLength={64}
        autoFocus
      />
      <FormError message={formError(state)} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
