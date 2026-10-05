import { CheckIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ReviewQuestion = {
  id: string;
  text: string;
  points: number;
  options: { id: string; text: string; isCorrect: boolean }[];
  answer: { selectedOptionIds: string[]; isCorrect: boolean | null } | null;
};

/** Savollar bo'yicha tahlil: tanlangan va to'g'ri variantlar. Faqat yakunlangan urinish uchun */
export function AttemptReview({
  questions,
  selectedLabel,
}: {
  questions: ReviewQuestion[];
  /** Tanlangan variant yonidagi yozuv: "sizning javobingiz" / "o'quvchi javobi" */
  selectedLabel: string;
}) {
  return (
    <ol className="flex flex-col gap-3">
      {questions.map((q, i) => {
        const selected = new Set(q.answer?.selectedOptionIds ?? []);
        const correct = q.answer?.isCorrect === true;
        return (
          <li key={q.id} className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{i + 1}.</span>
              {correct ? (
                <Badge>To&apos;g&apos;ri · +{q.points}</Badge>
              ) : selected.size === 0 ? (
                <Badge variant="secondary">Javob berilmagan</Badge>
              ) : (
                <Badge variant="destructive">Noto&apos;g&apos;ri</Badge>
              )}
            </div>
            <p className="break-words whitespace-pre-wrap">{q.text}</p>
            <ul className="flex flex-col gap-1 text-sm">
              {q.options.map((o, oi) => (
                <li
                  key={o.id}
                  className={cn(
                    "flex items-start gap-2 rounded-md border px-3 py-2",
                    o.isCorrect && "border-primary/50 bg-primary/10",
                    selected.has(o.id) &&
                      !o.isCorrect &&
                      "border-destructive/50 bg-destructive/10",
                  )}
                >
                  <span className="text-muted-foreground">
                    {String.fromCharCode(65 + oi)})
                  </span>
                  <span className="min-w-0 flex-1 break-words">{o.text}</span>
                  {selected.has(o.id) && (
                    <span className="text-muted-foreground shrink-0">
                      {selectedLabel}
                    </span>
                  )}
                  {o.isCorrect ? (
                    <CheckIcon
                      className="size-4 shrink-0"
                      aria-label="To'g'ri javob"
                    />
                  ) : selected.has(o.id) ? (
                    <XIcon
                      className="text-destructive size-4 shrink-0"
                      aria-label="Noto'g'ri"
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
