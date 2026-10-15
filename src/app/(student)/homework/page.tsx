import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireStudent } from "@/lib/auth/guards";
import {
  CATEGORY_LABEL,
  formatPoints,
  type AssignmentCategory,
} from "@/lib/grades";
import {
  HOMEWORK_STATUS_LABEL,
  homeworkStatus,
  type HomeworkStatus,
} from "@/lib/homework";
import { getStudentAssignments } from "@/lib/homework-data";
import { formatDate, todayInTashkent } from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vazifalar" };

const FILTERS: { value: AssignmentCategory | ""; label: string }[] = [
  { value: "", label: "Hammasi" },
  { value: "HOMEWORK", label: "Uyga vazifa" },
  { value: "PRACTICAL", label: "Amaliy" },
  { value: "BONUS", label: "Bonus" },
];

const STATUS_CLASS: Record<HomeworkStatus, string> = {
  DONE: "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  PENDING: "",
  MISSED: "border-destructive/40 bg-destructive/10 text-destructive",
};

// O'quvchi o'z guruhining topshiriqlarini va faqat o'z ballarini ko'radi (guruh sessiyadan).
// Ishni darsda ko'rsatadi — saytda topshirish yo'q
export default async function MyHomeworkPage({
  searchParams,
}: PageProps<"/homework">) {
  const student = await requireStudent();
  const { type } = await searchParams;
  const filter = FILTERS.find((f) => f.value === type)?.value ?? "";
  const today = todayInTashkent();

  const all = student.groupId
    ? await getStudentAssignments(student.id, student.groupId)
    : [];
  const items = filter ? all.filter((a) => a.category === filter) : all;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Vazifalar</h1>
        <p className="text-muted-foreground text-sm">
          Vazifani darsda o&apos;qituvchiga ko&apos;rsatasiz, ballni
          o&apos;qituvchi qo&apos;yadi.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1" aria-label="Turi bo'yicha">
        {FILTERS.map((f) => (
          <Link
            prefetch={false}
            key={f.value}
            href={f.value ? `/homework?type=${f.value}` : "/homework"}
            aria-current={filter === f.value ? "page" : undefined}
            className={buttonVariants({
              size: "sm",
              variant: filter === f.value ? "secondary" : "ghost",
            })}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {!student.groupId ? (
        <p className="text-muted-foreground">
          Siz hali guruhga qo&apos;shilmagansiz.
        </p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Hozircha vazifa yo&apos;q.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((a) => {
            const status = homeworkStatus(a.points, a.dueDate, today);
            const max = a.category === "HOMEWORK" ? 1 : a.maxPoints;
            return (
              <li key={a.id} className="flex flex-col gap-1 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{a.title}</span>
                  <Badge variant="outline" className={cn(STATUS_CLASS[status])}>
                    {HOMEWORK_STATUS_LABEL[status]}
                    {a.points !== null && ` · ${formatPoints(a.points)}/${max}`}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {CATEGORY_LABEL[a.category]} · muddat {formatDate(a.dueDate)}
                  {a.dueDate === today && " (bugun)"} · {a.semesterName}
                </p>
                {a.description && (
                  <p className="text-sm whitespace-pre-wrap">{a.description}</p>
                )}
                {a.note && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      O&apos;qituvchi izohi:
                    </span>{" "}
                    {a.note}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
