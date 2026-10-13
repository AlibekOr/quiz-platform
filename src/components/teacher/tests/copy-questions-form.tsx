"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { copyQuestions } from "@/app/(teacher)/teacher/tests/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SourceQuestion = {
  id: string;
  text: string;
  type: "SINGLE" | "MULTIPLE";
  points: number;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export function CopyQuestionsForm({
  testId,
  sourceTestId,
  basePath,
  questions,
}: {
  testId: string;
  sourceTestId: string;
  basePath: string;
  questions: SourceQuestion[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const allSelected = selected.length === questions.length;

  function toggle(id: string, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  }

  function submit() {
    startTransition(async () => {
      const result = await copyQuestions(testId, {
        sourceTestId,
        // Manba testidagi tartibda
        questionIds: questions
          .filter((q) => selected.includes(q.id))
          .map((q) => q.id),
      });
      if (result.ok) {
        toast.success(result.message);
        router.push(`${basePath}/tests/${testId}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={allSelected}
            onChange={(e) =>
              setSelected(e.target.checked ? questions.map((q) => q.id) : [])
            }
          />
          Hammasini belgilash
        </label>
        <Button onClick={submit} disabled={pending || selected.length === 0}>
          {pending
            ? "Qo'shilmoqda..."
            : `Tanlanganlarni qo'shish (${selected.length})`}
        </Button>
      </div>

      <ol className="flex flex-col gap-2">
        {questions.map((q, i) => {
          const checked = selected.includes(q.id);
          return (
            <li key={q.id}>
              <label
                className={cn(
                  "hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  checked && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="checkbox"
                  className="accent-primary mt-1 size-4 shrink-0"
                  checked={checked}
                  onChange={(e) => toggle(q.id, e.target.checked)}
                />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="break-words whitespace-pre-wrap">
                    <span className="text-muted-foreground">{i + 1}. </span>
                    {q.text}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {q.type === "SINGLE" ? "Bitta javob" : "Bir nechta javob"} ·{" "}
                    {q.points} ball
                  </span>
                  <span className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                    {q.options.map((o, oi) => (
                      <span
                        key={o.id}
                        className={cn(
                          "break-words",
                          o.isCorrect
                            ? "text-primary font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {String.fromCharCode(65 + oi)}) {o.text}
                        {o.isCorrect && " ✓"}
                      </span>
                    ))}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
