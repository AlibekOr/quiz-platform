"use client";

import { useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  createQuestion,
  updateQuestion,
} from "@/app/(teacher)/teacher/tests/actions";
import { applyServerErrors } from "@/components/common/form-errors";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_OPTIONS,
  questionFormSchema,
  type QuestionFormInput,
} from "@/lib/validators/test";
import type { EditorQuestion } from "./types";

const NEW_QUESTION: QuestionFormInput = {
  text: "",
  type: "SINGLE",
  points: 1,
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
};

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
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(questionFormSchema),
    defaultValues: question ?? NEW_QUESTION,
  });
  const options = useFieldArray({ control: form.control, name: "options" });
  const { errors } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });
  const values = useWatch({ control: form.control, name: "options" });

  function changeType(next: EditorQuestion["type"]) {
    form.setValue("type", next);
    if (next === "SINGLE") {
      // SINGLE ga o'tganda faqat birinchi to'g'ri javob qoladi
      const first = values.findIndex((o) => o.isCorrect);
      values.forEach((_, i) =>
        form.setValue(`options.${i}.isCorrect`, i === first),
      );
    }
  }

  function setCorrect(index: number, checked: boolean) {
    if (type === "SINGLE")
      values.forEach((_, i) =>
        form.setValue(`options.${i}.isCorrect`, i === index),
      );
    else form.setValue(`options.${index}.isCorrect`, checked);
  }

  const onSubmit = form.handleSubmit((input) =>
    startTransition(async () => {
      const result = question
        ? await updateQuestion(question.id, input)
        : await createQuestion(testId, input);
      if (result.ok) {
        if (result.message) toast.success(result.message);
        onDone();
      } else {
        applyServerErrors(form, result);
      }
    }),
  );

  const optionsError = errors.options?.root?.message ?? errors.options?.message;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <FormField id="q-text" label="Savol" error={errors.text?.message}>
        <Textarea
          id="q-text"
          maxLength={2000}
          rows={3}
          autoFocus
          aria-invalid={!!errors.text}
          {...form.register("text")}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField id="q-type" label="Turi" error={errors.type?.message}>
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
        </FormField>
        <FormField id="q-points" label="Ball" error={errors.points?.message}>
          <Input
            id="q-points"
            type="number"
            min={1}
            max={100}
            aria-invalid={!!errors.points}
            {...form.register("points", { valueAsNumber: true })}
          />
        </FormField>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">
          Variantlar{" "}
          <span className="text-muted-foreground font-normal">
            (to&apos;g&apos;ri javobni belgilang, bo&apos;sh qatorlar hisobga
            olinmaydi)
          </span>
        </legend>
        {options.fields.map((field, i) => {
          const letter = String.fromCharCode(65 + i);
          return (
            <div key={field.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  type={type === "SINGLE" ? "radio" : "checkbox"}
                  name="correct"
                  aria-label={`${letter} varianti to'g'ri`}
                  className="accent-primary size-4 shrink-0"
                  checked={values[i]?.isCorrect ?? false}
                  onChange={(e) => setCorrect(i, e.target.checked)}
                />
                <span className="text-muted-foreground w-4 shrink-0 text-sm">
                  {letter}
                </span>
                <Input
                  aria-label={`${letter} varianti matni`}
                  maxLength={500}
                  {...form.register(`options.${i}.text`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${letter} variantini o'chirish`}
                  disabled={options.fields.length <= 2}
                  onClick={() => options.remove(i)}
                >
                  <Trash2Icon />
                </Button>
              </div>
              {errors.options?.[i]?.text?.message && (
                <p className="text-destructive pl-10 text-sm">
                  {errors.options[i].text.message}
                </p>
              )}
            </div>
          );
        })}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={options.fields.length >= MAX_OPTIONS}
            onClick={() => options.append({ text: "", isCorrect: false })}
          >
            <PlusIcon />
            Variant qo&apos;shish
          </Button>
        </div>
        <FormError message={optionsError} />
      </fieldset>

      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
