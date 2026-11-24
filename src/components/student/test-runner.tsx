"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudCheckIcon,
  CloudOffIcon,
  LoaderIcon,
  MaximizeIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  submitAttempt,
  type TabLeaveResult,
} from "@/app/(student)/test/actions";
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
import { formatDuration } from "@/lib/time";
import { cn } from "@/lib/utils";
import { TAB_LEAVE_LIMIT } from "@/lib/tests/integrity";
import { useAutosave, type SaveStatus } from "./use-autosave";
import {
  enterFullscreen,
  exitFullscreen,
  useFullscreen,
} from "./use-fullscreen";
import { useNow } from "./use-now";
import { useTabGuard } from "./use-tab-guard";

export type RunnerQuestion = {
  id: string;
  text: string;
  type: "SINGLE" | "MULTIPLE";
  points: number;
  options: { id: string; text: string }[];
};

export function TestRunner({
  attemptId,
  title,
  deadlineAt,
  serverNow,
  questions,
  initialAnswers,
}: {
  attemptId: string;
  title: string;
  /** ms */
  deadlineAt: number;
  /** Server vaqti (ms) — klient soati noto'g'ri bo'lsa ham taymer to'g'ri ishlaydi */
  serverNow: number;
  questions: RunnerQuestion[];
  initialAnswers: Record<string, string[]>;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const submittedRef = useRef(false);
  // Yopildi yoki bekor qilindi: sahifa almashguncha overlay va dialoglar chiqmaydi
  const [ended, setEnded] = useState(false);
  const [clockOffset] = useState(() => serverNow - Date.now());

  const now = useNow();
  const remainingSec =
    now === null
      ? null
      : Math.max(0, Math.ceil((deadlineAt - (now + clockOffset)) / 1000));

  const router = useRouter();
  const autosave = useAutosave(
    attemptId,
    () => submit(true),
    () => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setEnded(true);
      exitFullscreen();
      toast.error("Bu urinish o'qituvchi tomonidan bekor qilindi");
      router.replace("/dashboard");
    },
  );

  function submit(auto: boolean) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setEnded(true);
    setConfirmOpen(false);
    exitFullscreen();
    if (auto) toast.info("Vaqt tugadi. Test topshirilmoqda...");
    startSubmit(async () => {
      await autosave.flush();
      // Muvaffaqiyatda action /result ga redirect qiladi
      const result = await submitAttempt(attemptId);
      if (!result.ok) {
        submittedRef.current = false;
        setEnded(false);
        toast.error(result.error);
      }
    });
  }

  const [warning, setWarning] = useState<{
    leaves: number;
    remaining: number;
  } | null>(null);
  const fullscreen = useFullscreen();
  // Brauzer to'liq ekranni rad etsa (cheklangan brauzer, webview) — talab qilinmaydi, test davom etadi
  const [fullscreenDenied, setFullscreenDenied] = useState(false);

  function requestFullscreen() {
    enterFullscreen().then((ok) => {
      if (!ok) setFullscreenDenied(true);
    });
  }

  function onTabLeave(result: TabLeaveResult) {
    if (submittedRef.current) return;
    if (!result.ok) {
      // Urinish yopilgan, bekor qilingan yoki vaqt tugagan: submitAttempt to'g'ri sahifaga yo'naltiradi
      if (result.ended) submit(false);
      return;
    }
    if (result.closed) {
      // Server urinishni allaqachon yopdi: javoblar saqlanganlari bo'yicha baholandi
      submittedRef.current = true;
      setEnded(true);
      setWarning(null);
      setConfirmOpen(false);
      exitFullscreen();
      toast.error(
        `Test yopildi: ${TAB_LEAVE_LIMIT} marta boshqa oynaga chiqdingiz`,
      );
      router.replace(`/result/${attemptId}`);
      return;
    }
    setWarning({ leaves: result.leaves, remaining: result.remaining });
  }

  useTabGuard(attemptId, {
    active: !ended && remainingSec !== 0,
    onResult: onTabLeave,
  });

  useEffect(() => {
    if (remainingSec === 0) submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat vaqt tugaganda
  }, [remainingSec]);

  const question = questions[index];
  const selected = answers[question.id] ?? [];
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length,
    [questions, answers],
  );

  function choose(optionId: string, checked: boolean) {
    const next =
      question.type === "SINGLE"
        ? [optionId]
        : checked
          ? [...selected.filter((id) => id !== optionId), optionId]
          : selected.filter((id) => id !== optionId);
    setAnswers((a) => ({ ...a, [question.id]: next }));
    autosave.save(question.id, next);
  }

  const locked = ended || submitting || remainingSec === 0;

  return (
    // Matnni belgilash, nusxalash va o'ng tugma menyusi o'chirilgan (ChatGPT'ga ko'chirmaslik uchun)
    <div
      className="flex flex-col gap-6 select-none [-webkit-touch-callout:none]"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {!fullscreen && !fullscreenDenied && !locked && (
        <div className="bg-background fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <MaximizeIcon className="text-muted-foreground size-10" />
          <div className="flex max-w-sm flex-col gap-1">
            <p className="text-lg font-semibold">
              Test to&apos;liq ekranda ishlanadi
            </p>
            <p className="text-muted-foreground text-sm">
              Davom etish uchun to&apos;liq ekranga o&apos;ting. Vaqt
              to&apos;xtamaydi.
            </p>
          </div>
          <Button size="lg" onClick={requestFullscreen}>
            <MaximizeIcon />
            To&apos;liq ekranga o&apos;tish
          </Button>
        </div>
      )}

      <div className="bg-background/95 sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="truncate font-semibold">{title}</p>
          <p className="text-muted-foreground text-sm">
            Javob berilgan: {answeredCount}/{questions.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={autosave.status} />
          <span
            role="timer"
            aria-label="Qolgan vaqt"
            className={cn(
              "rounded-md border px-3 py-1 font-mono text-lg tabular-nums",
              remainingSec !== null &&
                remainingSec <= 60 &&
                "border-destructive text-destructive",
            )}
          >
            {remainingSec === null ? "--:--" : formatDuration(remainingSec)}
          </span>
        </div>
      </div>

      <nav aria-label="Savollar" className="flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const answered = (answers[q.id]?.length ?? 0) > 0;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-current={i === index ? "step" : undefined}
              aria-label={`${i + 1}-savol${answered ? ", javob berilgan" : ""}`}
              className={cn(
                "size-9 rounded-md border text-sm font-medium transition-colors",
                answered && "border-primary/40 bg-primary/10",
                i === index &&
                  "ring-ring ring-offset-background ring-2 ring-offset-2",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </nav>

      <section aria-labelledby="question-text" className="flex flex-col gap-4">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <span>
            {index + 1}/{questions.length}-savol
          </span>
          <span>·</span>
          <span>{question.points} ball</span>
          <span>·</span>
          <span>
            {question.type === "SINGLE"
              ? "Bitta javob tanlang"
              : "Bir nechta javob tanlang"}
          </span>
        </div>
        <p
          id="question-text"
          className="text-lg break-words whitespace-pre-wrap"
        >
          {question.text}
        </p>
        <fieldset className="flex flex-col gap-2" disabled={locked}>
          <legend className="sr-only">Variantlar</legend>
          {question.options.map((o, i) => {
            const checked = selected.includes(o.id);
            return (
              <label
                key={o.id}
                className={cn(
                  "hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  checked && "border-primary bg-primary/5",
                )}
              >
                <input
                  type={question.type === "SINGLE" ? "radio" : "checkbox"}
                  name={question.id}
                  className="accent-primary mt-1 size-4 shrink-0"
                  checked={checked}
                  onChange={(e) => choose(o.id, e.target.checked)}
                />
                <span className="text-muted-foreground">
                  {String.fromCharCode(65 + i)})
                </span>
                <span className="min-w-0 break-words">{o.text}</span>
              </label>
            );
          })}
        </fieldset>
      </section>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={() => setIndex(index - 1)}
          disabled={index === 0}
        >
          <ChevronLeftIcon />
          Oldingi
        </Button>
        {index < questions.length - 1 ? (
          <Button variant="outline" onClick={() => setIndex(index + 1)}>
            Keyingi
            <ChevronRightIcon />
          </Button>
        ) : (
          <Button onClick={() => setConfirmOpen(true)} disabled={locked}>
            Topshirish
          </Button>
        )}
      </div>
      {index < questions.length - 1 && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={() => setConfirmOpen(true)}
            disabled={locked}
          >
            Testni topshirish
          </Button>
        </div>
      )}

      <AlertDialog
        open={warning !== null}
        onOpenChange={(open) => !open && setWarning(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <TriangleAlertIcon className="size-5" />
              Ogohlantirish ({warning?.leaves}/{TAB_LEAVE_LIMIT})
            </AlertDialogTitle>
            <AlertDialogDescription>
              Siz test oynasidan chiqdingiz.{" "}
              {warning?.remaining === 1 ? (
                <b>Yana bir marta chiqsangiz, test yopiladi!</b>
              ) : (
                `Yana ${warning?.remaining} marta chiqsangiz, test yopiladi.`
              )}{" "}
              O&apos;qituvchi chiqishlar sonini ko&apos;radi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => {
                setWarning(null);
                requestFullscreen();
              }}
            >
              Tushundim
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Testni topshirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < questions.length
                ? `${questions.length - answeredCount} ta savolga javob berilmagan. `
                : "Barcha savollarga javob berdingiz. "}
              Topshirgandan keyin javoblarni o&apos;zgartirib bo&apos;lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              Davom etish
            </AlertDialogCancel>
            <Button onClick={() => submit(false)} disabled={submitting}>
              Topshirish
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  const content = {
    saving: {
      icon: <LoaderIcon className="size-4 animate-spin" />,
      text: "Saqlanmoqda...",
    },
    saved: { icon: <CloudCheckIcon className="size-4" />, text: "Saqlandi" },
    error: {
      icon: <CloudOffIcon className="size-4" />,
      text: "Saqlanmadi, qayta urinilmoqda",
    },
  }[status];
  return (
    <span
      role="status"
      className={cn(
        "text-muted-foreground flex items-center gap-1 text-sm",
        status === "error" && "text-destructive",
      )}
    >
      {content.icon}
      <span className="hidden sm:inline">{content.text}</span>
    </span>
  );
}
