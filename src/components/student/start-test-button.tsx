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
import { TAB_LEAVE_LIMIT } from "@/lib/tests/integrity";
import { enterFullscreen, exitFullscreen } from "./use-fullscreen";

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
    /** Davomiylik tugashidan oldin yopiladigan test: yopilish vaqti ("11:00") */
    closesAt: string | null;
  };
  label: string;
  isRetake: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function start() {
    // Bosish paytida so'raladi (brauzer faqat shunda ruxsat beradi); test sahifasida ham saqlanadi
    void enterFullscreen();
    startTransition(async () => {
      // Muvaffaqiyatda action /test/[id] ga redirect qiladi
      const result = await startAttempt(test.id);
      if (!result.ok) {
        exitFullscreen();
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
                {test.closesAt && (
                  <li>
                    Test <b>{test.closesAt}</b> da yopiladi: vaqtingiz shu bilan
                    cheklanadi.
                  </li>
                )}
                <li>
                  Boshlaganingizdan keyin vaqt to&apos;xtamaydi, sahifani
                  yopsangiz ham.
                </li>
                <li>
                  Javoblar avtomatik saqlanadi. Vaqt tugasa, test o&apos;zi
                  topshiriladi.
                </li>
                <li>
                  Test to&apos;liq ekranda ishlanadi. Boshqa tab yoki ilovaga
                  o&apos;tmang:{" "}
                  <b>{TAB_LEAVE_LIMIT} marta chiqsangiz, test yopiladi</b> va
                  o&apos;qituvchi buni ko&apos;radi.
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
