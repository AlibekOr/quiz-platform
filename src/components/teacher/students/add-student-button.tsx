"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentDialog } from "./student-dialog";
import type { GroupOption } from "./types";

export function AddStudentButton({ groups }: { groups: GroupOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={groups.length === 0}>
        <PlusIcon />
        O&apos;quvchi qo&apos;shish
      </Button>
      <StudentDialog open={open} onOpenChange={setOpen} groups={groups} />
    </>
  );
}
