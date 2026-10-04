"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { toast } from "sonner";
import {
  importQuestions,
  previewQuestionImport,
} from "@/app/(teacher)/teacher/tests/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EXCEL_COLUMNS, type ParsedQuestion } from "@/lib/tests/import";
import { cn } from "@/lib/utils";

const JSON_EXAMPLE = `[{ "text": "...", "type": "SINGLE", "points": 1,
   "options": [{ "text": "...", "isCorrect": true }, { "text": "...", "isCorrect": false }] }]`;

export function ImportQuestions({ testId }: { testId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[] | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const errorCount = questions?.filter((q) => q.errors.length > 0).length ?? 0;

  function toFormData(f: File) {
    const formData = new FormData();
    formData.append("file", f);
    return formData;
  }

  function onFile(selected: File | undefined) {
    setQuestions(null);
    setError(undefined);
    setFile(selected ?? null);
    if (!selected) return;

    startTransition(async () => {
      const preview = await previewQuestionImport(toFormData(selected));
      if (preview.ok) setQuestions(preview.questions);
      else setError(preview.error);
    });
  }

  function onImport() {
    if (!file || errorCount > 0) return;
    startTransition(async () => {
      // Server faylni qayta o'qiydi va tekshiradi
      const result = await importQuestions(testId, toFormData(file));
      if (result.ok) {
        toast.success(result.message);
        router.push(`/teacher/tests/${testId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 text-sm md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <p className="font-medium">Excel (.xlsx)</p>
          <p>
            Ustunlar:{" "}
            <code className="bg-muted rounded px-1 py-0.5">
              {EXCEL_COLUMNS.join(" | ")}
            </code>
          </p>
          <p className="text-muted-foreground">
            <code>correct</code> — to&apos;g&apos;ri variant harfi:{" "}
            <code>B</code> yoki <code>A,C</code>. E–J ustunlari ham
            qo&apos;shilishi mumkin. <code>type</code> bo&apos;sh bo&apos;lsa,
            javoblar soniga qarab aniqlanadi; <code>points</code> bo&apos;sh
            bo&apos;lsa — 1.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <p className="font-medium">JSON (.json)</p>
          <pre className="bg-muted overflow-x-auto rounded p-2 text-xs">
            {JSON_EXAMPLE}
          </pre>
        </div>
      </div>

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
                  , xato yo&apos;q. Savollar test oxiriga qo&apos;shiladi
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
