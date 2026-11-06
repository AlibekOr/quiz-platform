"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { LibraryIcon } from "lucide-react";
import { toast } from "sonner";
import { saveTestQuestionsToBank } from "@/app/(teacher)/teacher/bank/actions";
import { FormError, FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
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
import { DIFFICULTY_LABEL, type Difficulty } from "@/lib/bank";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/** "Savollarni bankka saqlash": mavzu va qiyinlik tanlanadi, takroriylari qo'shilmaydi */
export function SaveToBankButton({
  testId,
  topics,
}: {
  testId: string;
  topics: { id: string; path: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <LibraryIcon />
        Bankka saqlash
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Savollarni bankka saqlash</DialogTitle>
            <DialogDescription>
              Testning barcha savollari tanlangan mavzu va qiyinlik bilan bankka
              nusxalanadi. Bankda bor (bir xil matn va variantlar) savollar
              qayta qo&apos;shilmaydi.
            </DialogDescription>
          </DialogHeader>
          {topics.length === 0 ? (
            <p className="text-sm">
              Avval{" "}
              <Link prefetch={false} href="/teacher/bank" className="underline">
                savollar bankida
              </Link>{" "}
              mavzu yarating.
            </p>
          ) : (
            <form
              className="flex flex-col gap-4"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setError(undefined);
                startTransition(async () => {
                  const result = await saveTestQuestionsToBank(testId, {
                    topicId,
                    difficulty,
                  });
                  if (result.ok) {
                    toast.success(result.message);
                    setOpen(false);
                  } else setError(result.error);
                });
              }}
            >
              <FormField id="save-topic" label="Mavzu">
                <NativeSelect
                  id="save-topic"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                >
                  {topics.map((t) => (
                    <NativeSelectOption key={t.id} value={t.id}>
                      {t.path}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField id="save-difficulty" label="Qiyinlik">
                <NativeSelect
                  id="save-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                  {DIFFICULTIES.map((d) => (
                    <NativeSelectOption key={d} value={d}>
                      {DIFFICULTY_LABEL[d]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
              <FormError message={error} />
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  Saqlash
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
