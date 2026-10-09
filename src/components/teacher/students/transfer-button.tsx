"use client";

import { useState } from "react";
import { ArrowRightLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransferDialog, type TransferStudent } from "./transfer-dialog";
import type { GroupOption } from "./types";

/** O'quvchi kartochkasidagi "Boshqa guruhga o'tkazish" tugmasi */
export function TransferButton({
  student,
  groups,
}: {
  student: TransferStudent;
  groups: GroupOption[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <ArrowRightLeftIcon />
        {student.groupId ? "Boshqa guruhga o'tkazish" : "Guruhga qo'shish"}
      </Button>
      <TransferDialog
        open={open}
        onOpenChange={setOpen}
        students={[student]}
        groups={groups}
      />
    </>
  );
}
