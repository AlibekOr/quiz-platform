"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import {
  importBankQuestions,
  previewBankImport,
} from "@/app/(teacher)/teacher/bank/actions";
import {
  importQuestions,
  previewQuestionImport,
} from "@/app/(teacher)/teacher/tests/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/bank";
import { EXCEL_COLUMNS, type ParsedQuestion } from "@/lib/tests/import";
import { cn } from "@/lib/utils";

const JSON_EXAMPLE = `[{ "text": "...", "type": "SINGLE", "points": 1,
   "options": [{ "text": "...", "isCorrect": true }, { "text": "...", "isCorrect": false }] }]`;
const JSON_BANK_EXAMPLE = `[{ "text": "...", "type": "SINGLE", "points": 1,
   "topic": "CSS Flexbox", "difficulty": "oson",
   "options": [{ "text": "...", "isCorrect": true }, { "text": "...", "isCorrect": false }] }]`;

/** Import manzili: test yoki o'qituvchining savollar banki */
export type ImportTarget =
  | { kind: "test"; testId: string; basePath: string }
  | { kind: "bank"; topics: { id: string; path: string }[] };

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export function ImportQuestions({ target }: { target: ImportTarget }) {
  const router = useRouter();
  const bank = target.kind === "bank";
  const [topicId, setTopicId] = useState(
    target.kind === "bank" ? (target.topics[0]?.id ?? "") : "",
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[] | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const errorCount = questions?.filter((q) => q.errors.length > 0).length ?? 0;

  function toFormData(f: File) {
    const formData = new FormData();
    formData.append("file", f);
    if (bank) {
      formData.append("topicId", topicId);
      formData.append("difficulty", difficulty);
    }
    return formData;
  }

  function onFile(selected: File | undefined) {
    setQuestions(null);
    setError(undefined);
    setFile(selected ?? null);
    if (!selected) return;

    startTransition(async () => {
      const preview = bank
        ? await previewBankImport(toFormData(selected))
        : await previewQuestionImport(toFormData(selected));
      if (preview.ok) setQuestions(preview.questions);
      else setError(preview.error);
    });
  }

  function onImport() {
    if (!file || errorCount > 0) return;
    startTransition(async () => {
      // Server faylni qayta o'qiydi va tekshiradi
      const result =
        target.kind === "bank"
          ? await importBankQuestions(toFormData(file))
          : await importQuestions(target.testId, toFormData(file));
      if (result.ok) {
        toast.success(result.message);
        router.push(
          target.kind === "bank"
            ? "/teacher/bank"
            : `${target.basePath}/tests/${target.testId}`,
        );
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2 rounded-lg border p-4">
          <p className="font-medium">Excel (.xlsx)</p>
          <p>
            Ustunlar:{" "}
            <code className="bg-muted rounded px-1 py-0.5 break-all">
              {EXCEL_COLUMNS.join(" | ")}
              {bank && " | topic | difficulty"}
            </code>
          </p>
          <p className="text-muted-foreground">
            <code>correct</code> — to&apos;g&apos;ri variant harfi:{" "}
            <code>B</code> yoki <code>A,C</code>. E–J ustunlari ham
            qo&apos;shilishi mumkin. <code>type</code> bo&apos;sh bo&apos;lsa,
            javoblar soniga qarab aniqlanadi; <code>points</code> bo&apos;sh
            bo&apos;lsa — 1.
            {bank && (
              <>
                {" "}
                <code>topic</code> — mavzu nomi (yo&apos;q bo&apos;lsa
                yaratiladi), <code>difficulty</code> — oson / o&apos;rta /
                qiyin. Bo&apos;sh bo&apos;lsa — quyida tanlangani.
              </>
            )}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 rounded-lg border p-4">
          <p className="font-medium">JSON (.json)</p>
          <pre className="bg-muted overflow-x-auto rounded p-2 text-xs">
            {bank ? JSON_BANK_EXAMPLE : JSON_EXAMPLE}
          </pre>
        </div>
      </div>

      {target.kind === "bank" && (
        <div className="grid gap-4 sm:max-w-xl sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-topic">
              Mavzu (bo&apos;sh qatorlar uchun)
            </Label>
            <NativeSelect
              id="import-topic"
              value={topicId}
              disabled={pending || questions !== null}
              onChange={(e) => setTopicId(e.target.value)}
            >
              {target.topics.map((t) => (
                <NativeSelectOption key={t.id} value={t.id}>
                  {t.path}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-difficulty">
              Qiyinlik (bo&apos;sh qatorlar uchun)
            </Label>
            <NativeSelect
              id="import-difficulty"
              value={difficulty}
              disabled={pending || questions !== null}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {DIFFICULTIES.map((d) => (
                <NativeSelectOption key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="file">Fayl</Label>
        <Input
          id="file"
          type="file"
          accept=".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => onFile(e.target.files?.[0])}
          disabled={pending}
          className="sm:max-w-sm"
        />
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {questions && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Jami {questions.length} ta savol
              {errorCount > 0 ? (
                <span className="text-destructive">
                  , {errorCount} tasida xato — tuzatib, faylni qayta yuklang
                </span>
              ) : (
                <span className="text-muted-foreground">
                  , xato yo&apos;q.{" "}
                  {bank
                    ? "Bankda bor savollar qayta qo'shilmaydi"
                    : "Savollar test oxiriga qo'shiladi"}
                </span>
              )}
            </p>
            <Button onClick={onImport} disabled={pending || errorCount > 0}>
              {questions.length} ta savolni qo&apos;shish
            </Button>
          </div>
          <ol className="flex flex-col gap-3">
            {questions.map((q) => (
              <li
                key={q.line}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 text-sm",
                  q.errors.length > 0 &&
                    "border-destructive/50 bg-destructive/5",
                )}
              >
                <div className="text-muted-foreground flex flex-wrap items-center gap-2">
                  <span>{q.line}-qator</span>
                  {q.preview.type && (
                    <Badge variant="secondary">{q.preview.type}</Badge>
                  )}
                  <span>{q.preview.points} ball</span>
                  {bank && q.bank.topic && (
                    <Badge variant="outline">{q.bank.topic}</Badge>
                  )}
                  {bank && q.bank.difficulty && (
                    <Badge variant="outline">{q.bank.difficulty}</Badge>
                  )}
                </div>
                <p className="font-medium break-words whitespace-pre-wrap">
                  {q.preview.text || "—"}
                </p>
                <ul className="grid gap-1 sm:grid-cols-2">
                  {q.preview.options.map((o, i) => (
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
                {q.errors.length > 0 && (
                  <ul className="text-destructive list-disc pl-4">
                    {q.errors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
