"use client";

import { useState } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { setStudentActive } from "@/app/teacher/students/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { StudentDialog } from "./student-dialog";
import type { GroupOption, StudentRow } from "./types";

export function StudentRowActions({
  student,
  groups,
}: {
  student: StudentRow;
  groups: GroupOption[];
}) {
  const [dialog, setDialog] = useState<"edit" | "password" | "block" | null>(
    null,
  );
  const close = (open: boolean) => !open && setDialog(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${student.fullName}: amallar`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("password")}>
            Parolni tiklash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant={student.isActive ? "destructive" : "default"}
            onClick={() => setDialog("block")}
          >
            {student.isActive ? "Bloklash" : "Blokdan chiqarish"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StudentDialog
        open={dialog === "edit"}
        onOpenChange={close}
        groups={groups}
        student={student}
      />
      <ResetPasswordDialog
        open={dialog === "password"}
        onOpenChange={close}
        student={student}
      />
      <ConfirmAction
        open={dialog === "block"}
        onOpenChange={close}
        title={student.isActive ? "O'quvchini bloklash" : "Blokdan chiqarish"}
        description={
          student.isActive
            ? `${student.fullName} tizimga kira olmaydi va reytingda ko'rinmaydi. Ochiq sessiyasi ham yopiladi.`
            : `${student.fullName} yana tizimga kira oladi.`
        }
        confirmLabel={student.isActive ? "Bloklash" : "Blokdan chiqarish"}
        destructive={student.isActive}
        action={() => setStudentActive(student.id, !student.isActive)}
      />
    </>
  );
}
