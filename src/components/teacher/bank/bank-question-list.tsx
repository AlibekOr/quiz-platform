"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CheckIcon,
  CopyIcon,
  FileUpIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  duplicateBankQuestion,
  setBankQuestionArchived,
} from "@/app/(teacher)/teacher/bank/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DIFFICULTY_LABEL,
  MIN_ATTEMPTS_FOR_STATS,
  type Difficulty,
} from "@/lib/bank";
import type { BankListItem, TopicNode } from "@/lib/bank-data";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import { BankQuestionDialog } from "./bank-question-dialog";

const DIFFICULTY_VARIANT: Record<
  Difficulty,
  "secondary" | "outline" | "destructive"
> = {
  EASY: "outline",
  MEDIUM: "secondary",
  HARD: "destructive",
};

/** Bank savollari: qaysi testlarda ishlatilgani va to'g'ri javob foizi bilan */
export function BankQuestionList({
  items,
  total,
  topics,
  activeTopicId,
  readOnly,
  testHref,
}: {
  items: BankListItem[];
  total: number;
  topics: TopicNode[];
  activeTopicId: string | null;
  readOnly: boolean;
  /** Test sahifasi yo'li (prefiks); null — havola yo'q */
  testHref: string | null;
}) {
  const [editing, setEditing] = useState<BankListItem | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.error);
    });
  }

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {total} ta savol
          {total > items.length && ` (birinchi ${items.length} tasi)`}
        </p>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <Link
              prefetch={false}
              href="/teacher/bank/import"
              className={buttonVariants({ variant: "outline" })}
            >
              <FileUpIcon />
              Import
            </Link>
            <Button
              onClick={() => setEditing("new")}
              disabled={topics.length === 0}
              title={topics.length === 0 ? "Avval mavzu yarating" : undefined}
            >
              <PlusIcon />
              Savol qo&apos;shish
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Savol topilmadi.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((q) => (
            <li
              key={q.id}
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3 text-sm sm:p-4",
                q.archived && "opacity-70",
              )}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{q.topicPath}</Badge>
                <Badge variant={DIFFICULTY_VARIANT[q.difficulty]}>
                  {DIFFICULTY_LABEL[q.difficulty]}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {q.type === "SINGLE" ? "Bitta javob" : "Bir nechta javob"} ·{" "}
                  {q.points} ball
                </span>
                {q.tags.map((t) => (
                  <span
                    key={t}
                    className="bg-muted rounded px-1.5 py-0.5 text-xs"
                  >
                    #{t}
                  </span>
                ))}
                {q.archived && <Badge variant="outline">Arxivda</Badge>}
              </div>
              <p className="font-medium break-words whitespace-pre-wrap">
                {q.text}
              </p>
              <ul className="grid gap-1 sm:grid-cols-2">
                {q.options.map((o, i) => (
                  <li
                    key={i}
                    className={cn("flex gap-2", o.isCorrect && "font-medium")}
                  >
                    <span className="text-muted-foreground">
                      {String.fromCharCode(65 + i)})
                    </span>
                    <span className="min-w-0 break-words">{o.text}</span>
                    {o.isCorrect && (
                      <CheckIcon
                        className="size-4 shrink-0"
                        aria-label="To'g'ri javob"
                      />
                    )}
                  </li>
                ))}
              </ul>
              {q.explanation && (
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {q.explanation}
                </p>
              )}
              <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
                <span>
                  {q.tests.length === 0 ? (
                    "Testlarda ishlatilmagan"
                  ) : (
                    <>
                      Testlarda:{" "}
                      {q.tests.map((t, i) => (
                        <span key={t.id}>
                          {i > 0 && ", "}
                          {testHref ? (
                            <Link
                              prefetch={false}
                              href={`${testHref}/${t.id}`}
                              className="hover:underline"
                            >
                              {t.title}
                            </Link>
                          ) : (
                            t.title
                          )}
                        </span>
                      ))}
                    </>
                  )}
                  {" · "}
                  {q.rate === null
                    ? `To'g'ri javob foizi ${MIN_ATTEMPTS_FOR_STATS} ta javobdan keyin (${q.answers} ta)`
                    : `To'g'ri javob: ${q.rate}% (${q.answers} ta javob)`}
                </span>
                {!readOnly && (
                  <span className="flex gap-1">
                    {!q.archived && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(q)}
                      >
                        <PencilIcon />
                        Tahrirlash
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => run(() => duplicateBankQuestion(q.id))}
                    >
                      <CopyIcon />
                      Nusxa
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        run(() => setBankQuestionArchived(q.id, !q.archived))
                      }
                    >
                      {q.archived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                      {q.archived ? "Qaytarish" : "Arxivlash"}
                    </Button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <BankQuestionDialog
          question={editing === "new" ? undefined : editing}
          topics={topics}
          defaultTopicId={activeTopicId}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
