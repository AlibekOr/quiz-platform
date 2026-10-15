import { BookOpenCheckIcon, TriangleAlertIcon } from "lucide-react";
import type { HomeworkPrefill } from "@/lib/homework-data";
import { formatDate } from "@/lib/time";
import { AddHomeworkButton } from "./homework-controls";

function GiveButton({ p, label }: { p: HomeworkPrefill; label: string }) {
  return (
    <AddHomeworkButton
      size="sm"
      label={label}
      periods={[{ id: p.semesterId, name: p.semesterName }]}
      initial={{
        semesterId: p.semesterId,
        lessonId: p.lessonId,
        lessonDate: p.lessonDate,
        title: p.title,
        dueDate: p.dueDate,
      }}
    />
  );
}

/** Davomat saqlangandan keyin: "Bugungi dars uchun uyga vazifa yoki amaliy bering" */
export function HomeworkSuggestion({ lesson }: { lesson: HomeworkPrefill }) {
  return (
    <section className="border-primary/40 bg-primary/5 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <BookOpenCheckIcon className="text-primary mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">
            {lesson.groupName}: bu dars uchun uyga vazifa yoki amaliy
            topshiriq bering
          </p>
          <p className="text-muted-foreground text-sm">
            {formatDate(lesson.lessonDate)} darsi · muddat keyingi dars,{" "}
            {formatDate(lesson.dueDate)}
          </p>
        </div>
      </div>
      <GiveButton p={lesson} label="Vazifa berish" />
    </section>
  );
}

/** O'tgan darslardan uyga vazifa ham, amaliy ham berilmaganlari (ogohlantirish) */
export function MissingHomeworkList({
  lessons,
}: {
  lessons: HomeworkPrefill[];
}) {
  if (lessons.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <TriangleAlertIcon className="size-4 text-amber-600" />
        Uyga vazifa yoki amaliy berilmagan darslar
      </h2>
      <ul className="flex flex-col divide-y divide-amber-500/20 text-sm">
        {lessons.map((l) => (
          <li
            key={l.lessonId}
            className="flex items-center justify-between gap-2 py-1.5"
          >
            <span>
              <span className="font-medium">{l.groupName}</span> ·{" "}
              {formatDate(l.lessonDate)}
            </span>
            <GiveButton p={l} label="Berish" />
          </li>
        ))}
      </ul>
    </section>
  );
}
