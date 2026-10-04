"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateTestSettings } from "@/app/teacher/tests/actions";
import { FormError } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { GroupOption } from "@/components/teacher/students/types";
import type { TestSettings } from "./types";

const FLAGS = [
  {
    key: "allowRetake",
    label: "Qayta ishlashga ruxsat",
    hint: "Reytingga faqat birinchi urinish kiradi",
  },
  {
    key: "showAnswers",
    label: "Natijada to'g'ri javoblarni ko'rsatish",
    hint: undefined,
  },
  {
    key: "shuffleQuestions",
    label: "Savollarni aralashtirish",
    hint: "Har bir o'quvchida tartib har xil",
  },
] as const;

export function TestSettingsForm({
  testId,
  initial,
  groups,
}: {
  testId: string;
  initial: TestSettings;
  groups: GroupOption[];
}) {
  const [settings, setSettings] = useState(initial);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function set<K extends keyof TestSettings>(key: K, value: TestSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function toggleGroup(id: string, checked: boolean) {
    set(
      "groupIds",
      checked
        ? [...settings.groupIds, id]
        : settings.groupIds.filter((g) => g !== id),
    );
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateTestSettings(testId, settings);
      if (result.ok) {
        setError(undefined);
        toast.success(result.message);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-lg border p-4">
      <h2 className="font-semibold">Sozlamalar</h2>
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Nomi</Label>
          <Input
            id="title"
            value={settings.title}
            onChange={(e) => set("title", e.target.value)}
            required
            maxLength={200}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="durationMin">Vaqt (daqiqa)</Label>
          <Input
            id="durationMin"
            type="number"
            min={1}
            max={300}
            value={settings.durationMin}
            onChange={(e) => set("durationMin", Number(e.target.value))}
            required
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Tavsif</Label>
        <Textarea
          id="description"
          value={settings.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={2000}
          rows={2}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Qoidalar</legend>
        {FLAGS.map(({ key, label, hint }) => (
          <label key={key} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-primary mt-0.5 size-4"
              checked={settings[key]}
              onChange={(e) => set(key, e.target.checked)}
            />
            <span>
              {label}
              {hint && (
                <span className="text-muted-foreground block">{hint}</span>
              )}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Guruhlar</legend>
        {groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">Guruhlar yo&apos;q.</p>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {groups.map((g) => (
              <label key={g.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={settings.groupIds.includes(g.id)}
                  onChange={(e) => toggleGroup(g.id, e.target.checked)}
                />
                {g.name}
              </label>
            ))}
          </div>
        )}
        {settings.groupIds.length === 0 && groups.length > 0 && (
          <p className="text-muted-foreground text-sm">
            Guruh tanlanmasa, testni hech kim ko&apos;rmaydi.
          </p>
        )}
      </fieldset>

      <FormError message={error} />
      <div>
        <Button type="submit" disabled={pending}>
          Saqlash
        </Button>
      </div>
    </form>
  );
}
