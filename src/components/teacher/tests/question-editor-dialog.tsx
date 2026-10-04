"use client";

import { useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { createQuestion, updateQuestion } from "@/app/(teacher)/teacher/tests/actions";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { MAX_OPTIONS } from "@/lib/validators/test";
import type { EditorOption, EditorQuestion } from "./types";

const EMPTY_OPTIONS: EditorOption[] = [
  { text: "", isCorrect: true },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
  { text: "", isCorrect: false },
];

export function QuestionEditorDialog({
  open,
  onOpenChange,
  testId,
  question,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  /** Berilmasa — yangi savol */
  question?: EditorQuestion;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {question ? "Savolni tahrirlash" : "Yangi savol"}
          </DialogTitle>
        </DialogHeader>
        <QuestionForm
          testId={testId}
          question={question}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function QuestionForm({
  testId,
  question,
  onDone,
}: {
  testId: string;
  question?: EditorQuestion;
  onDone: () => void;
}) {
  const [text, setText] = useState(question?.text ?? "");
  const [type, setType] = useState<EditorQuestion["type"]>(
    question?.type ?? "SINGLE",
  );
  const [points, setPoints] = useState(question?.points ?? 1);
  const [options, setOptions] = useState<EditorOption[]>(
    question?.options ?? EMPTY_OPTIONS,
  );
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function changeType(next: EditorQuestion["type"]) {
    setType(next);
    if (next === "SINGLE") {
      // SINGLE ga o'tganda faqat birinchi to'g'ri javob qoladi
      const first = options.findIndex((o) => o.isCorrect);
      setOptions(options.map((o, i) => ({ ...o, isCorrect: i === first })));
    }
  }

  function setCorrect(index: number, checked: boolean) {
    setOptions(
      options.map((o, i) =>
        type === "SINGLE"
          ? { ...o, isCorrect: i === index }
          : i === index
            ? { ...o, isCorrect: checked }
            : o,
      ),
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      text,
      type,
      points,
      // Bo'sh qoldirilgan variantlar yuborilmaydi
      options: options.filter((o) => o.text.trim() !== ""),
    };
    startTransition(async () => {
      const result = question
        ? await updateQuestion(question.id, input)
        : await createQuestion(testId, input);
      if (result.ok) {
        if (result.message) toast.success(result.message);
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="q-text">Savol</Label>
        <Textarea
          id="q-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          maxLength={2000}
          rows={3}
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="q-type">Turi</Label>
          <NativeSelect
            id="q-type"
            value={type}
            onChange={(e) =>
              changeType(e.target.value as EditorQuestion["type"])
            }
          >
            <NativeSelectOption value="SINGLE">Bitta javob</NativeSelectOption>
            <NativeSelectOption value="MULTIPLE">
              Bir nechta javob
            </NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="q-points">Ball</Label>
          <Input
            id="q-points"
            type="number"
            min={1}
            max={100}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">
          Variantlar{" "}
          <span className="text-muted-foreground font-normal">
            (to&apos;g&apos;ri javobni belgilang)
          </span>
        </legend>
        {options.map((option, i) => (
          <div
            key={option.id ?? `new-${i}`}
            className="flex items-center gap-2"
          >
            <input
              type={type === "SINGLE" ? "radio" : "checkbox"}
              name="correct"
              aria-label={`${String.fromCharCode(65 + i)} varianti to'g'ri`}
              className="accent-primary size-4 shrink-0"
              checked={option.isCorrect}
              onChange={(e) => setCorrect(i, e.target.checked)}
            />
            <span className="text-muted-foreground w-4 shrink-0 text-sm">
              {String.fromCharCode(65 + i)}
            </span>
            <Input
              value={option.text}
              aria-label={`${String.fromCharCode(65 + i)} varianti matni`}
              onChange={(e) =>
                setOptions(
                  options.map((o, j) =>
                    j === i ? { ...o, text: e.target.value } : o,
                  ),
                )
              }
              maxLength={500}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${String.fromCharCode(65 + i)} variantini o'chirish`}
              disabled={options.length <= 2}
              onClick={() => setOptions(options.filter((_, j) => j !== i))}
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={options.length >= MAX_OPTIONS}
            onClick={() =>
              setOptions([...options, { text: "", isCorrect: false }])
            }
          >
            <PlusIcon />
            Variant qo&apos;shish
          </Button>
        </div>
      </fieldset>

      <FormError message={error} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
