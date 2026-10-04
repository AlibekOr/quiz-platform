"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteTest, setTestActive } from "@/app/(teacher)/teacher/tests/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { Button } from "@/components/ui/button";

export function TestHeaderActions({
  testId,
  title,
  isActive,
  questionCount,
  attemptCount,
}: {
  testId: string;
  title: string;
  isActive: boolean;
  questionCount: number;
  attemptCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const result = await setTestActive(testId, !isActive);
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={toggleActive}
        disabled={pending || (!isActive && questionCount === 0)}
        variant={isActive ? "outline" : "default"}
        title={
          !isActive && questionCount === 0 ? "Avval savol qo'shing" : undefined
        }
      >
        {isActive ? "To'xtatish" : "Faollashtirish"}
      </Button>
      <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
        O&apos;chirish
      </Button>
      <ConfirmAction
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`"${title}" testini o'chirish`}
        description={
          attemptCount > 0 ? (
            <span className="text-destructive font-medium">
              Diqqat: bu testda {attemptCount} ta urinish (o&apos;quvchilar
              natijalari) bor. Ular ham butunlay o&apos;chadi va reytingdan
              yo&apos;qoladi. Bu amalni qaytarib bo&apos;lmaydi.
            </span>
          ) : (
            "Test va uning barcha savollari o'chadi. Bu amalni qaytarib bo'lmaydi."
          )
        }
        confirmLabel="O'chirish"
        destructive
        action={async () => {
          const result = await deleteTest(testId);
          if (result.ok) router.push("/teacher/tests");
          return result;
        }}
      />
    </div>
  );
}
