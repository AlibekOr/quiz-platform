"use client";

import { useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  createBankQuestionAction,
  updateBankQuestion,
} from "@/app/(teacher)/teacher/bank/actions";
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
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/bank";
import type { BankListItem, TopicNode } from "@/lib/bank-data";
import {
  bankQuestionFormSchema,
  type BankQuestionFormInput,
} from "@/lib/validators/bank";
import { MAX_OPTIONS } from "@/lib/validators/test";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

function initialValues(
  question: BankListItem | undefined,
  topicId: string,
): BankQuestionFormInput {
  if (question)
    return {
      text: question.text,
      type: question.type,
      points: question.points,
      options: question.options.map((o) => ({ ...o })),
      topicId: question.topicId,
      difficulty: question.difficulty,
      explanation: question.explanation ?? "",
      tags: question.tags.join(", "),
    };
  return {
    text: "",
    type: "SINGLE",
    points: 1,
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    topicId,
    difficulty: "MEDIUM",
    explanation: "",
    tags: "",
  };
}

export function BankQuestionDialog({
  question,
  topics,
  defaultTopicId,
  onClose,
}: {
  /** Berilmasa — yangi savol */
  question?: BankListItem;
  topics: TopicNode[];
  defaultTopicId: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {question ? "Bank savolini tahrirlash" : "Bankka yangi savol"}
          </DialogTitle>
        </DialogHeader>
        <BankQuestionForm
          question={question}
          topics={topics}
          topicId={defaultTopicId ?? topics[0]?.id ?? ""}
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function BankQuestionForm({
  question,
  topics,
  topicId,
  onDone,
}: {
  question?: BankListItem;
  topics: TopicNode[];
  topicId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm({
    resolver: zodResolver(bankQuestionFormSchema),
    defaultValues: initialValues(question, topicId),
  });
  const options = useFieldArray({ control: form.control, name: "options" });
  const { errors } = form.formState;
  const type = useWatch({ control: form.control, name: "type" });
  const values = useWatch({ control: form.control, name: "options" });

  function changeType(next: "SINGLE" | "MULTIPLE") {
    form.setValue("type", next);
    if (next === "SINGLE") {
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
        ? await updateBankQuestion(question.id, input)
        : await createBankQuestionAction(input);
      if (result.ok) {
        if (result.message) toast.success(result.message);
        onDone();
      } else applyServerErrors(form, result);
    }),
  );

  const optionsError = errors.options?.root?.message ?? errors.options?.message;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {question && question.tests.length > 0 && (
        <p className="bg-muted rounded-lg p-3 text-sm">
          Testlardagi nusxalar ({question.tests.length} ta test)
          o&apos;zgarmaydi — o&apos;zgarish faqat bankda.
        </p>
      )}
      <FormField id="bq-text" label="Savol" error={errors.text?.message}>
        <Textarea
          id="bq-text"
          maxLength={2000}
          rows={3}
          autoFocus
          aria-invalid={!!errors.text}
          {...form.register("text")}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField id="bq-topic" label="Mavzu" error={errors.topicId?.message}>
          <NativeSelect id="bq-topic" {...form.register("topicId")}>
            {topics.map((t) => (
              <NativeSelectOption key={t.id} value={t.id}>
                {t.path}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          id="bq-difficulty"
          label="Qiyinlik"
          error={errors.difficulty?.message}
        >
          <NativeSelect id="bq-difficulty" {...form.register("difficulty")}>
            {DIFFICULTIES.map((d) => (
              <NativeSelectOption key={d} value={d}>
                {DIFFICULTY_LABEL[d]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField id="bq-type" label="Turi" error={errors.type?.message}>
          <NativeSelect
            id="bq-type"
            value={type}
            onChange={(e) =>
              changeType(e.target.value as "SINGLE" | "MULTIPLE")
            }
          >
            <NativeSelectOption value="SINGLE">Bitta javob</NativeSelectOption>
            <NativeSelectOption value="MULTIPLE">
              Bir nechta javob
            </NativeSelectOption>
          </NativeSelect>
        </FormField>
        <FormField id="bq-points" label="Ball" error={errors.points?.message}>
          <Input
            id="bq-points"
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
            <div key={field.id} className="flex items-center gap-2">
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

      <FormField
        id="bq-explanation"
        label="Izoh (ixtiyoriy, o'quvchiga ko'rinmaydi)"
        error={errors.explanation?.message}
      >
        <Textarea
          id="bq-explanation"
          maxLength={2000}
          rows={2}
          {...form.register("explanation")}
        />
      </FormField>
      <FormField
        id="bq-tags"
        label="Teglar (vergul bilan)"
        error={errors.tags?.message}
      >
        <Input
          id="bq-tags"
          placeholder="flex, layout"
          {...form.register("tags")}
        />
      </FormField>

      <FormError message={errors.root?.server?.message} />
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </DialogFooter>
    </form>
  );
}
