"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelStudentAttempt } from "@/app/(teacher)/teacher/tests/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { Button } from "@/components/ui/button";

export function CancelAttemptButton({
  attemptId,
  studentName,
  isFirst,
  redirectTo,
}: {
  attemptId: string;
  studentName: string;
  isFirst: boolean;
  /** Muvaffaqiyatli bekor qilingandan keyin o'tiladigan sahifa */
  redirectTo: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Urinishni bekor qilish
      </Button>
      <ConfirmAction
        open={open}
        onOpenChange={setOpen}
        title="Urinishni bekor qilasizmi?"
        description={
          <>
            {studentName}ning bu urinishi va javoblari butunlay
            o&apos;chiriladi.
            {isFirst &&
              " Bu birinchi urinish: reytingda uning o'rniga keyingi urinishi hisoblanadi (bo'lmasa, yangi ishlagani)."}{" "}
            Bu amalni ortga qaytarib bo&apos;lmaydi.
          </>
        }
        confirmLabel="Ha, o'chirish"
        destructive
        action={async () => {
          const result = await cancelStudentAttempt(attemptId);
          if (result.ok) router.replace(redirectTo);
          return result;
        }}
      />
    </>
  );
}
