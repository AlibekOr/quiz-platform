"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  addBankQuestionsToTest,
  previewBankPick,
  replaceBankPick,
} from "@/app/(teacher)/teacher/bank/actions";
import { FormError } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  DIFFICULTY_LABEL,
  normalizeText,
  topicWithDescendants,
  type Difficulty,
} from "@/lib/bank";
import type { PickPreviewItem } from "@/lib/bank-data";
import { MAX_PICK_RULES } from "@/lib/validators/bank";
import { cn } from "@/lib/utils";

export type PickerTopic = { id: string; path: string; parentId: string | null };
export type PickerQuestion = {
  id: string;
  text: string;
  difficulty: Difficulty;
  topicId: string;
  points: number;
  /** Shu testda allaqachon bor (nusxasi) */
  inTest: boolean;
};

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

type Rule = {
  key: number;
  topicId: string;
  difficulty: Difficulty | null;
  count: number;
};

/** Testni bankdan yig'ish: qo'lda tanlash yoki qoidalar bo'yicha avtomatik */
export function BankPicker({
  testId,
  topics,
  questions,
  hasGroups,
}: {
  testId: string;
  topics: PickerTopic[];
  questions: PickerQuestion[];
  hasGroups: boolean;
}) {
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="tablist">
        {(
          [
            ["manual", "Qo'lda tanlash"],
            ["auto", "Avtomatik yig'ish"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            role="tab"
            aria-selected={mode === value}
            variant={mode === value ? "default" : "outline"}
            onClick={() => setMode(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      {mode === "manual" ? (
        <ManualPick testId={testId} topics={topics} questions={questions} />
      ) : (
        <AutoPick testId={testId} topics={topics} hasGroups={hasGroups} />
      )}
    </div>
  );
}

function useAddToTest(testId: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  function add(ids: string[]) {
    setError(undefined);
    startTransition(async () => {
      const result = await addBankQuestionsToTest(testId, ids);
      if (result.ok) {
        toast.success(result.message);
        router.push(`/teacher/tests/${testId}`);
      } else setError(result.error);
    });
  }
  return { add, pending, error };
}

function ManualPick({
  testId,
  topics,
  questions,
}: {
  testId: string;
  topics: PickerTopic[];
  questions: PickerQuestion[];
}) {
  const [q, setQ] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { add, pending, error } = useAddToTest(testId);
  const paths = useMemo(
    () => new Map(topics.map((t) => [t.id, t.path])),
    [topics],
  );

  const shown = useMemo(() => {
    const inTopic = topicId
      ? new Set(topicWithDescendants(topics, topicId))
      : null;
    const needle = normalizeText(q);
    return questions.filter(
      (item) =>
        (!inTopic || inTopic.has(item.topicId)) &&
        (!difficulty || item.difficulty === difficulty) &&
        (!needle || normalizeText(item.text).includes(needle)),
    );
  }, [questions, topics, topicId, difficulty, q]);

  function toggle(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const selectable = shown.filter((item) => !item.inTest);
  const allShownSelected =
    selectable.length > 0 && selectable.every((i) => selected.has(i.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Qidiruv"
          aria-label="Qidiruv"
          className="w-full sm:w-56"
        />
        <NativeSelect
          aria-label="Mavzu"
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
        >
          <NativeSelectOption value="">Barcha mavzular</NativeSelectOption>
          {topics.map((t) => (
            <NativeSelectOption key={t.id} value={t.id}>
              {t.path}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Qiyinlik"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <NativeSelectOption value="">Barcha qiyinliklar</NativeSelectOption>
          {DIFFICULTIES.map((d) => (
            <NativeSelectOption key={d} value={d}>
              {DIFFICULTY_LABEL[d]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={allShownSelected}
            disabled={selectable.length === 0}
            onChange={(e) =>
              selectable.forEach((i) => toggle(i.id, e.target.checked))
            }
          />
          Ko&apos;rinayotganlarning hammasi ({selectable.length})
        </label>
        <Button
          disabled={pending || selected.size === 0}
          onClick={() => add([...selected])}
        >
          {selected.size} ta savolni testga qo&apos;shish
        </Button>
      </div>
      <FormError message={error} />
      {shown.length === 0 ? (
        <p className="text-muted-foreground text-sm">Savol topilmadi.</p>
      ) : (
        <ul className="divide-y rounded-lg border text-sm">
          {shown.map((item) => (
            <li key={item.id}>
              <label
                className={cn(
                  "flex items-start gap-3 p-3",
                  item.inTest ? "opacity-60" : "hover:bg-muted/50",
                )}
              >
                <input
                  type="checkbox"
                  className="accent-primary mt-0.5 size-4 shrink-0"
                  disabled={item.inTest}
                  checked={selected.has(item.id)}
                  onChange={(e) => toggle(item.id, e.target.checked)}
                />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="break-words">{item.text}</span>
                  <span className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                    <span>{paths.get(item.topicId)}</span>
                    <span>{DIFFICULTY_LABEL[item.difficulty]}</span>
                    <span>{item.points} ball</span>
                    {item.inTest && <span>· testda bor</span>}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AutoPick({
  testId,
  topics,
  hasGroups,
}: {
  testId: string;
  topics: PickerTopic[];
  hasGroups: boolean;
}) {
  const [rules, setRules] = useState<Rule[]>([
    { key: 0, topicId: topics[0]?.id ?? "", difficulty: null, count: 5 },
  ]);
  const [nextKey, setNextKey] = useState(1);
  const [excludeUsed, setExcludeUsed] = useState(hasGroups);
  const [picked, setPicked] = useState<PickPreviewItem[][] | null>(null);
  /** Yig'ilgan paytdagi qoidalar ("Boshqasini tanlash" shu qoida bo'yicha) */
  const [pickedRules, setPickedRules] = useState<Rule[]>([]);
  const [shortages, setShortages] = useState<
    { rule: number; missing: number }[]
  >([]);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const adder = useAddToTest(testId);

  function updateRule(key: number, patch: Partial<Rule>) {
    setRules((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function build() {
    setError(undefined);
    startTransition(async () => {
      const result = await previewBankPick(testId, {
        rules: rules.map(({ topicId, difficulty, count }) => ({
          topicId,
          difficulty,
          count,
        })),
        excludeUsed,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPicked(result.picked);
      setPickedRules(rules);
      setShortages(result.shortages);
    });
  }

  function replace(ruleIndex: number, itemIndex: number) {
    if (!picked) return;
    const rule = pickedRules[ruleIndex];
    startTransition(async () => {
      const result = await replaceBankPick(testId, {
        rule: { topicId: rule.topicId, difficulty: rule.difficulty },
        selected: picked.flat().map((p) => p.id),
        excludeUsed,
      });
      if (!result.ok) toast.error(result.error);
      else if (!result.item)
        toast.error("Bu qoida bo'yicha boshqa savol qolmadi");
      else
        setPicked((prev) =>
          prev!.map((list, ri) =>
            ri === ruleIndex
              ? list.map((p, ii) => (ii === itemIndex ? result.item! : p))
              : list,
          ),
        );
    });
  }

  const total = picked?.flat().length ?? 0;
  const paths = new Map(topics.map((t) => [t.id, t.path]));

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {rules.map((rule, i) => (
          <li
            key={rule.key}
            className="flex flex-wrap items-center gap-2 rounded-lg border p-2"
          >
            <span className="text-muted-foreground w-5 text-sm">{i + 1}.</span>
            <NativeSelect
              aria-label="Mavzu"
              value={rule.topicId}
              onChange={(e) =>
                updateRule(rule.key, { topicId: e.target.value })
              }
            >
              {topics.map((t) => (
                <NativeSelectOption key={t.id} value={t.id}>
                  {t.path}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Qiyinlik"
              value={rule.difficulty ?? ""}
              onChange={(e) =>
                updateRule(rule.key, {
                  difficulty: (e.target.value || null) as Difficulty | null,
                })
              }
            >
              <NativeSelectOption value="">Har qanday</NativeSelectOption>
              {DIFFICULTIES.map((d) => (
                <NativeSelectOption key={d} value={d}>
                  {DIFFICULTY_LABEL[d]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Input
              aria-label="Soni"
              type="number"
              min={1}
              max={100}
              className="w-20"
              value={rule.count}
              onChange={(e) =>
                updateRule(rule.key, { count: Number(e.target.value) })
              }
            />
            <span className="text-sm">ta</span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${i + 1}-qoidani o'chirish`}
              disabled={rules.length <= 1}
              onClick={() =>
                setRules((prev) => prev.filter((r) => r.key !== rule.key))
              }
            >
              <Trash2Icon />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={rules.length >= MAX_PICK_RULES}
          onClick={() => {
            setRules((prev) => [
              ...prev,
              {
                key: nextKey,
                topicId: topics[0]?.id ?? "",
                difficulty: null,
                count: 5,
              },
            ]);
            setNextKey((k) => k + 1);
          }}
        >
          <PlusIcon />
          Qoida qo&apos;shish
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary size-4"
            checked={excludeUsed}
            onChange={(e) => setExcludeUsed(e.target.checked)}
          />
          Shu guruh(lar)ning boshqa testlarida ishlatilganlarni olmaslik
        </label>
      </div>
      {!hasGroups && excludeUsed && (
        <p className="text-muted-foreground text-xs">
          Testga hali guruh biriktirilmagan — bu belgi ta&apos;sir qilmaydi.
        </p>
      )}
      <div>
        <Button onClick={build} disabled={pending || topics.length === 0}>
          {picked ? "Qayta yig'ish" : "Yig'ish"}
        </Button>
      </div>
      <FormError message={error} />

      {picked && (
        <div className="flex flex-col gap-3">
          {shortages.length > 0 && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
              {shortages.map((s) => {
                const rule = pickedRules[s.rule];
                return (
                  <p key={s.rule}>
                    {s.rule + 1}-qoida ({paths.get(rule.topicId)}
                    {rule.difficulty &&
                      ` · ${DIFFICULTY_LABEL[rule.difficulty]}`}
                    ): {s.missing} ta savol yetishmayapti
                  </p>
                );
              })}
            </div>
          )}
          {picked.map((list, ri) => (
            <section key={ri} className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">
                {ri + 1}-qoida: {paths.get(pickedRules[ri].topicId)}
                {pickedRules[ri].difficulty &&
                  ` · ${DIFFICULTY_LABEL[pickedRules[ri].difficulty]}`}{" "}
                <span className="text-muted-foreground font-normal">
                  ({list.length} ta)
                </span>
              </h3>
              <ul className="divide-y rounded-lg border text-sm">
                {list.map((item, ii) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 p-3"
                  >
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="break-words">{item.text}</span>
                      <span className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                        <span>{item.topicPath}</span>
                        <Badge variant="outline">
                          {DIFFICULTY_LABEL[item.difficulty]}
                        </Badge>
                        <span>{item.points} ball</span>
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => replace(ri, ii)}
                    >
                      <RefreshCwIcon />
                      Boshqasi
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="flex flex-col gap-2">
            <FormError message={adder.error} />
            <div>
              <Button
                disabled={adder.pending || total === 0}
                onClick={() => adder.add(picked.flat().map((p) => p.id))}
              >
                {total} ta savolni testga qo&apos;shish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
