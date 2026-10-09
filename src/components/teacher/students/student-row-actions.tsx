"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";
import {
  deleteStudent,
  removeStudentFromGroup,
  setStudentActive,
  setStudentArchived,
} from "@/app/(teacher)/teacher/students/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { RequestDeletionDialog } from "@/components/manager/request-deletion-dialog";
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
import { TransferDialog } from "./transfer-dialog";
import type { GroupOption, StaffVariant, StudentRow } from "./types";

type DialogKind =
  | "edit"
  | "password"
  | "transfer"
  | "block"
  | "removeGroup"
  | "archive"
  | "restore"
  | "delete"
  | "requestDeletion";

export function StudentRowActions({
  student,
  groups,
  onCard,
  variant = "teacher",
}: {
  student: StudentRow;
  groups: GroupOption[];
  variant?: StaffVariant;
  /** O'quvchi kartochkasida: butunlay o'chirilgandan keyin ro'yxatga qaytadi */
  onCard?: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const close = (open: boolean) => !open && setDialog(null);
  const teacher = variant === "teacher";

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
          {student.archived ? (
            <>
              <DropdownMenuItem onClick={() => setDialog("restore")}>
                Tiklash
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDialog("delete")}
              >
                Butunlay o&apos;chirish
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setDialog("edit")}>
                Tahrirlash
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialog("password")}>
                Parolni tiklash
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDialog("transfer")}>
                {student.groupId
                  ? "Boshqa guruhga o'tkazish"
                  : "Guruhga qo'shish"}
              </DropdownMenuItem>
              {teacher && student.groupId && (
                <DropdownMenuItem onClick={() => setDialog("removeGroup")}>
                  Guruhdan chiqarish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant={student.isActive ? "destructive" : "default"}
                onClick={() => setDialog("block")}
              >
                {student.isActive ? "Bloklash" : "Blokdan chiqarish"}
              </DropdownMenuItem>
              {teacher ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDialog("archive")}
                >
                  Arxivlash
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  variant="destructive"
                  disabled={student.deletionPending}
                  onClick={() => setDialog("requestDeletion")}
                >
                  {student.deletionPending
                    ? "O'chirish kutilmoqda"
                    : "O'chirishni so'rash"}
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {!student.archived && (
        <>
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
          <TransferDialog
            open={dialog === "transfer"}
            onOpenChange={close}
            students={[student]}
            groups={groups}
          />
          {!teacher && (
            <RequestDeletionDialog
              open={dialog === "requestDeletion"}
              onOpenChange={close}
              student={student}
            />
          )}
        </>
      )}
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
      <RemoveFromGroupConfirm
        open={dialog === "removeGroup"}
        onOpenChange={close}
        student={student}
      />
      <ConfirmAction
        open={dialog === "archive"}
        onOpenChange={close}
        title="O'quvchini arxivlash"
        description={`${student.fullName} tizimga kira olmaydi, ro'yxatlar, reyting va davomatda ko'rinmaydi. Natijalari saqlanadi, "Arxiv" filtridan tiklash mumkin.`}
        confirmLabel="Arxivlash"
        destructive
        action={() => setStudentArchived(student.id, true)}
      />
      <ConfirmAction
        open={dialog === "restore"}
        onOpenChange={close}
        title="Arxivdan tiklash"
        description={`${student.fullName} yana ro'yxatlarda ko'rinadi va tizimga kira oladi${student.groupName ? ` (guruhi: ${student.groupName})` : ". Guruhi yo'q: tiklangandan keyin guruhga qo'shing"}.`}
        confirmLabel="Tiklash"
        action={() => setStudentArchived(student.id, false)}
      />
      <ConfirmAction
        open={dialog === "delete"}
        onOpenChange={close}
        title="Butunlay o'chirish"
        description={`${student.fullName} va uning barcha test natijalari, davomati va aloqa ma'lumotlari butunlay o'chiriladi. Buni qaytarib bo'lmaydi.`}
        confirmLabel="Butunlay o'chirish"
        destructive
        action={async () => {
          const result = await deleteStudent(student.id);
          if (result.ok && onCard) router.replace("/teacher/students");
          return result;
        }}
      />
    </>
  );
}

/** Guruh sahifasida ham ishlatiladi */
export function RemoveFromGroupConfirm({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: { id: string; fullName: string; groupName: string | null };
}) {
  return (
    <ConfirmAction
      open={open}
      onOpenChange={onOpenChange}
      title="Guruhdan chiqarish"
      description={`${student.fullName} ${student.groupName ? `"${student.groupName}" guruhidan` : "guruhdan"} chiqariladi: guruh testlarini ko'rmaydi va guruh reytingida chiqmaydi. Test natijalari va davomat tarixi saqlanadi, keyin boshqa guruhga qo'shish mumkin.`}
      confirmLabel="Guruhdan chiqarish"
      destructive
      action={() => removeStudentFromGroup(student.id)}
    />
  );
}
