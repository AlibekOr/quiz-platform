import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, TriangleAlertIcon } from "lucide-react";
import { QuestionList } from "@/components/teacher/tests/question-list";
import { TestHeaderActions } from "@/components/teacher/tests/test-header-actions";
import { TestSettingsForm } from "@/components/teacher/tests/test-settings-form";
import { TestStatusBadge } from "@/components/staff/tests/test-status-badge";
import type { CurrentUser } from "@/lib/auth/guards";
import { groupScopeWhere } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { getTestAccess, staffBase } from "@/lib/tests/access";
import { formatTestWindow } from "@/lib/tests/schedule";
import { toLocalDateTime } from "@/lib/time";

/**
 * Test sahifasi. Menejer: tahrirlash faqat o'zi yaratgan va barcha guruhlari doirada
 * bo'lgan testda, aks holda faqat ko'rish. Baholash (davrlar) faqat o'qituvchida
 */
export async function TestEditView({
  user,
  id,
}: {
  user: CurrentUser;
  id: string;
}) {
  const access = await getTestAccess(user, id);
  if (!access) notFound();
  const readOnly = !access.canEdit;
  const base = staffBase(user.role);

  const [test, groups] = await Promise.all([
    db.test.findUnique({
      where: { id },
      include: {
        groups: {
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
        questions: {
          orderBy: { order: "asc" },
          include: { options: { orderBy: { order: "asc" } } },
        },
        _count: { select: { attempts: true } },
      },
    }),
    db.group.findMany({
      where: groupScopeWhere(access.scope),
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!test) notFound();

  const attemptCount = test._count.attempts;
  const now = new Date();
  const schedule = formatTestWindow(test, now);

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={`${base}/tests`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Testlar
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold break-words">
                {test.title}
              </h1>
              <TestStatusBadge test={test} now={now} />
            </div>
            {schedule && (
              <p className="text-muted-foreground text-sm">Ochiq: {schedule}</p>
            )}
          </div>
          <TestHeaderActions
            testId={test.id}
            title={test.title}
            isActive={test.isActive}
            questionCount={test.questions.length}
            attemptCount={attemptCount}
            basePath={base}
            readOnly={readOnly}
          />
        </div>
      </div>

      {readOnly && (
        <p className="bg-muted rounded-lg p-3 text-sm">
          Faqat ko&apos;rish: testni boshqa foydalanuvchi yaratgan yoki u
          sizning doirangizdan tashqaridagi guruhlarga ham biriktirilgan.
          Natijalarni o&apos;z guruhlaringiz bo&apos;yicha ko&apos;rishingiz
          mumkin.
        </p>
      )}

      {!readOnly && attemptCount > 0 && (
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
        readOnly={readOnly}
        initial={{
          title: test.title,
          description: test.description ?? "",
          durationMin: test.durationMin,
          allowRetake: test.allowRetake,
          showAnswers: test.showAnswers,
          shuffleQuestions: test.shuffleQuestions,
          startsAt: test.startsAt ? toLocalDateTime(test.startsAt) : "",
          endsAt: test.endsAt ? toLocalDateTime(test.endsAt) : "",
          groupIds: test.groups.map((g) => g.id),
        }}
      />

      <QuestionList
        testId={test.id}
        basePath={base}
        readOnly={readOnly}
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
