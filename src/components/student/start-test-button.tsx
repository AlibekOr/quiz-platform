"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { startAttempt } from "@/app/(student)/test/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function StartTestButton({
  test,
  label,
  isRetake,
}: {
  test: {
    id: string;
    title: string;
    durationMin: number;
    questionCount: number;
  };
  label: string;
  isRetake: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      // Muvaffaqiyatda action /test/[id] ga redirect qiladi
      const result = await startAttempt(test.id);
      if (!result.ok) {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={isRetake ? "outline" : "default"}
      >
        {label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{test.title}</AlertDialogTitle>
            <AlertDialogDescription render={<div />}>
              <ul className="flex list-disc flex-col gap-1 pl-4 text-left">
                <li>
                  Vaqt: <b>{test.durationMin} daqiqa</b>, savollar:{" "}
                  <b>{test.questionCount} ta</b>
                </li>
                <li>
                  Boshlaganingizdan keyin vaqt to&apos;xtamaydi, sahifani
                  yopsangiz ham.
                </li>
                <li>
                  Javoblar avtomatik saqlanadi. Vaqt tugasa, test o&apos;zi
                  topshiriladi.
                </li>
                {isRetake && (
                  <li>
                    Qayta urinish reytingga kirmaydi — faqat birinchi natija
                    hisoblanadi.
                  </li>
                )}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              Bekor qilish
            </AlertDialogCancel>
            <Button onClick={start} disabled={pending}>
              {pending ? "Boshlanmoqda..." : "Boshlash"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
