"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  CheckIcon,
  CopyIcon,
  FileUpIcon,
  ListPlusIcon,
  PencilIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  addBankQuestionsToTest,
  duplicateBankQuestion,
  setBankQuestionArchived,
  setBankQuestionsArchived,
} from "@/app/(teacher)/teacher/bank/actions";
import { FormError } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
  tests,
}: {
  items: BankListItem[];
  total: number;
  topics: TopicNode[];
  activeTopicId: string | null;
  readOnly: boolean;
  /** Test sahifasi yo'li (prefiks); null — havola yo'q */
  testHref: string | null;
  /** Tanlanganlarni qo'shish mumkin bo'lgan testlar */
  tests: { id: string; title: string }[];
}) {
  const [editing, setEditing] = useState<BankListItem | "new" | null>(null);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);

  // Filtr o'zgarsa, ko'rinmay qolganlar tanlovdan tushadi
  const chosen = useMemo(
    () => items.filter((q) => selected.has(q.id)),
    [items, selected],
  );
  const allSelected = items.length > 0 && chosen.length === items.length;
  const addable = chosen.filter((q) => !q.archived).map((q) => q.id);
  const restoreMode = chosen.length > 0 && chosen.every((q) => q.archived);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function run(action: () => Promise<ActionResult>, onOk?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        onOk?.();
      } else toast.error(result.error);
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

      {!readOnly && items.length > 0 && (
        <div className="bg-background sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
          <label className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              className="accent-primary size-4"
              checked={allSelected}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? new Set(items.map((q) => q.id))
                    : new Set(),
                )
              }
            />
            Hammasini tanlash ({items.length})
          </label>
          {chosen.length > 0 && (
            <>
              <span className="text-muted-foreground">
                · {chosen.length} ta tanlandi
              </span>
              <span className="ml-auto flex flex-wrap gap-1">
                {addable.length > 0 && (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => setAddOpen(true)}
                  >
                    <ListPlusIcon />
                    Testga qo&apos;shish
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        setBankQuestionsArchived(
                          chosen.map((q) => q.id),
                          !restoreMode,
                        ),
                      () => setSelected(new Set()),
                    )
                  }
                >
                  {restoreMode ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                  {restoreMode ? "Qaytarish" : "Arxivlash"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Tanlovni bekor qilish"
                  onClick={() => setSelected(new Set())}
                >
                  <XIcon />
                </Button>
              </span>
            </>
          )}
        </div>
      )}

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
                selected.has(q.id) && "border-primary",
              )}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {!readOnly && (
                  <input
                    type="checkbox"
                    className="accent-primary mr-1 size-4"
                    aria-label="Savolni tanlash"
                    checked={selected.has(q.id)}
                    onChange={(e) => toggle(q.id, e.target.checked)}
                  />
                )}
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

      {addOpen && (
        <AddToTestDialog
          questionIds={addable}
          tests={tests}
          skippedArchived={chosen.length - addable.length}
          onClose={() => setAddOpen(false)}
          onDone={() => {
            setAddOpen(false);
            setSelected(new Set());
          }}
        />
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

/** Tanlangan savollarni mavjud testga nusxalash */
function AddToTestDialog({
  questionIds,
  tests,
  skippedArchived,
  onClose,
  onDone,
}: {
  questionIds: string[];
  tests: { id: string; title: string }[];
  skippedArchived: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [testId, setTestId] = useState(tests[0]?.id ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {questionIds.length} ta savolni testga qo&apos;shish
          </DialogTitle>
          <DialogDescription>
            Savollar testga nusxa qilib qo&apos;shiladi. Testda bor savollar
            qayta qo&apos;shilmaydi.
            {skippedArchived > 0 &&
              ` Arxivdagi ${skippedArchived} ta savol qo'shilmaydi.`}
          </DialogDescription>
        </DialogHeader>
        {tests.length === 0 ? (
          <p className="text-sm">
            Sizda hali test yo&apos;q.{" "}
            <Link
              prefetch={false}
              href="/teacher/tests"
              className="underline"
            >
              Testlar
            </Link>{" "}
            sahifasida test yarating.
          </p>
        ) : (
          <NativeSelect
            aria-label="Test"
            className="w-full"
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
          >
            {tests.map((t) => (
              <NativeSelectOption key={t.id} value={t.id}>
                {t.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
        <FormError message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button
            disabled={pending || !testId}
            onClick={() => {
              setError(undefined);
              startTransition(async () => {
                const result = await addBankQuestionsToTest(
                  testId,
                  questionIds,
                );
                if (result.ok) {
                  toast.success(result.message);
                  onDone();
                } else setError(result.error);
              });
            }}
          >
            Qo&apos;shish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
