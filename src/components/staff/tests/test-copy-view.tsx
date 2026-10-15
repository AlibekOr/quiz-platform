import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ParamSelect } from "@/components/common/param-select";
import { CopyQuestionsForm } from "@/components/teacher/tests/copy-questions-form";
import type { CurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getTestAccess, staffBase, testScopeWhere } from "@/lib/tests/access";

/**
 * Boshqa testdan savollarni nusxa qilish: faqat testni tahrirlay oladiganlar uchun.
 * Manba — foydalanuvchiga ko'rinadigan, savoli bor boshqa testlar (copyQuestions qayta tekshiradi)
 */
export async function TestCopyView({
  user,
  id,
  from,
}: {
  user: CurrentUser;
  id: string;
  from: string | null;
}) {
  const access = await getTestAccess(user, id);
  if (!access?.canEdit) notFound();
  const base = staffBase(user.role);

  const [test, sources] = await Promise.all([
    db.test.findUnique({ where: { id }, select: { id: true, title: true } }),
    db.test.findMany({
      where: {
        AND: [
          testScopeWhere(access.scope),
          { id: { not: id } },
          { questions: { some: {} } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        _count: { select: { questions: true } },
      },
    }),
  ]);
  if (!test) notFound();

  const source = sources.find((s) => s.id === from) ?? null;
  const questions = source
    ? await db.question.findMany({
        where: { testId: source.id },
        orderBy: { order: "asc" },
        select: {
          id: true,
          text: true,
          type: true,
          points: true,
          options: {
            orderBy: { order: "asc" },
            select: { id: true, text: true, isCorrect: true },
          },
        },
      })
    : [];

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          prefetch={false}
          href={`${base}/tests/${test.id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          {test.title}
        </Link>
        <h1 className="text-2xl font-semibold">
          Boshqa testdan savol qo&apos;shish
        </h1>
        <p className="text-muted-foreground text-sm">
          Tanlangan savollar shu testga nusxa bo&apos;lib qo&apos;shiladi. Asl
          testdagi savollar o&apos;zgarmaydi.
        </p>
      </div>

      {sources.length === 0 ? (
        <p className="text-muted-foreground">
          Savoli bor boshqa test yo&apos;q.
        </p>
      ) : (
        <div className="max-w-md">
          <ParamSelect
            name="from"
            label="Qaysi testdan"
            value={source?.id ?? ""}
            placeholder="Testni tanlang"
            options={sources.map((s) => ({
              value: s.id,
              label: `${s.title} (${s._count.questions} ta savol)`,
            }))}
          />
        </div>
      )}

      {source && (
        <CopyQuestionsForm
          key={source.id}
          testId={test.id}
          sourceTestId={source.id}
          basePath={base}
          questions={questions}
        />
      )}
    </>
  );
}
