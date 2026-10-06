"use client";

import { useState } from "react";
import { UserMinusIcon } from "lucide-react";
import { RemoveFromGroupConfirm } from "@/components/teacher/students/student-row-actions";
import { Button } from "@/components/ui/button";

export function RemoveFromGroupButton({
  student,
}: {
  student: { id: string; fullName: string; groupName: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`${student.fullName}: guruhdan chiqarish`}
        title="Guruhdan chiqarish"
        onClick={() => setOpen(true)}
      >
        <UserMinusIcon />
      </Button>
      <RemoveFromGroupConfirm
        open={open}
        onOpenChange={setOpen}
        student={student}
      />
    </>
  );
}
