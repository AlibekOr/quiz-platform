import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, TriangleAlertIcon } from "lucide-react";
import { QuestionList } from "@/components/teacher/tests/question-list";
import { TestHeaderActions } from "@/components/teacher/tests/test-header-actions";
import { TestGradingForm } from "@/components/teacher/tests/test-grading-form";
import { TestSettingsForm } from "@/components/teacher/tests/test-settings-form";
import { Badge } from "@/components/ui/badge";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { fromDbDate } from "@/lib/time";

export const metadata: Metadata = { title: "Testni tahrirlash" };

export default async function EditTestPage({
  params,
}: PageProps<"/teacher/tests/[id]">) {
  await requireTeacher();
  const { id } = await params;

  const [test, groups] = await Promise.all([
    db.test.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            periods: {
              orderBy: { startDate: "desc" },
              select: { id: true, name: true },
            },
          },
        },
        periods: { select: { periodId: true, points: true } },
        questions: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
        _count: { select: { attempts: true } },
      },
    }),
    db.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!test) notFound();

  const attemptCount = test._count.attempts;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href="/teacher/tests"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Testlar
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold break-words">{test.title}</h1>
            {test.isActive ? (
              <Badge>Faol</Badge>
            ) : (
              <Badge variant="secondary">Qoralama</Badge>
            )}
          </div>
          <TestHeaderActions
            testId={test.id}
            title={test.title}
            isActive={test.isActive}
            questionCount={test.questions.length}
            attemptCount={attemptCount}
          />
        </div>
      </div>

      {attemptCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>
            Bu testda {attemptCount} ta urinish bor. Savollar yoki
            to&apos;g&apos;ri javoblarni o&apos;zgartirish mavjud natijalar va
            reytingga ta&apos;sir qilishi mumkin.
          </p>
        </div>
      )}

      <TestSettingsForm
        key={test.id}
        testId={test.id}
        groups={groups}
        initial={{
          title: test.title,
          description: test.description ?? "",
          durationMin: test.durationMin,
          allowRetake: test.allowRetake,
          showAnswers: test.showAnswers,
          shuffleQuestions: test.shuffleQuestions,
          groupIds: test.groups.map((g) => g.id),
        }}
      />

      <TestGradingForm
        // Guruhlar o'zgarsa forma yangidan quriladi
        key={test.groups.map((g) => g.id).join(",")}
        testId={test.id}
        dueDate={test.dueDate ? fromDbDate(test.dueDate) : null}
        groups={test.groups.map((g) => ({
          id: g.id,
          name: g.name,
          periods: g.periods.map((p) => ({
            id: p.id,
            name: p.name,
            points:
              test.periods.find((tp) => tp.periodId === p.id)?.points ?? null,
          })),
        }))}
      />

      <QuestionList
        testId={test.id}
        questions={test.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          points: q.points,
          options: q.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        }))}
      />
    </>
  );
}
