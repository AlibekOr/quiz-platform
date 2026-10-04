"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  FileUpIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { deleteQuestion, moveQuestion } from "@/app/(teacher)/teacher/tests/actions";
import { ConfirmAction } from "@/components/common/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuestionEditorDialog } from "./question-editor-dialog";
import type { EditorQuestion } from "./types";

export function QuestionList({
  testId,
  questions,
}: {
  testId: string;
  questions: EditorQuestion[];
}) {
  const [editing, setEditing] = useState<EditorQuestion | "new" | null>(null);
  const [deleting, setDeleting] = useState<EditorQuestion | null>(null);
  const [pending, startTransition] = useTransition();
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  function move(id: string, direction: "up" | "down") {
    startTransition(async () => {
      const result = await moveQuestion(id, direction);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold">
          Savollar{" "}
          <span className="text-muted-foreground font-normal">
            ({questions.length} ta, jami {totalPoints} ball)
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/teacher/tests/${testId}/import`}
            className={buttonVariants({ variant: "outline" })}
          >
            <FileUpIcon />
            Import (JSON/Excel)
          </Link>
          <Button onClick={() => setEditing("new")}>
            <PlusIcon />
            Savol qo&apos;shish
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="text-muted-foreground">Hali savol yo&apos;q.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {questions.map((q, index) => (
            <li
              key={q.id}
              className="flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-foreground font-medium">
                      {index + 1}.
                    </span>
                    <Badge variant="secondary">
                      {q.type === "SINGLE" ? "Bitta javob" : "Bir nechta javob"}
                    </Badge>
                    <span>{q.points} ball</span>
                  </div>
                  <p className="break-words whitespace-pre-wrap">{q.text}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${index + 1}-savolni yuqoriga`}
                    disabled={pending || index === 0}
                    onClick={() => move(q.id, "up")}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${index + 1}-savolni pastga`}
                    disabled={pending || index === questions.length - 1}
                    onClick={() => move(q.id, "down")}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${index + 1}-savolni tahrirlash`}
                    onClick={() => setEditing(q)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${index + 1}-savolni o'chirish`}
                    onClick={() => setDeleting(q)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {q.options.map((o, i) => (
                  <li
                    key={o.id}
                    className={cn(
                      "flex items-start gap-2 rounded-md px-2 py-1",
                      o.isCorrect && "bg-primary/10 font-medium",
                    )}
                  >
                    <span className="text-muted-foreground">
                      {String.fromCharCode(65 + i)})
                    </span>
                    <span className="min-w-0 break-words">{o.text}</span>
                    {o.isCorrect && (
                      <CheckIcon
                        className="ml-auto size-4 shrink-0"
                        aria-label="To'g'ri javob"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      <QuestionEditorDialog
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        testId={testId}
        question={editing === "new" || editing === null ? undefined : editing}
      />
      <ConfirmAction
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Savolni o'chirish"
        description="Savol va unga berilgan javoblar o'chadi. Bu amalni qaytarib bo'lmaydi."
        confirmLabel="O'chirish"
        destructive
        action={() => deleteQuestion(deleting!.id)}
      />
    </section>
  );
}
