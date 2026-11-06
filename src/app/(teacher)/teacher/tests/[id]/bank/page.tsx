import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { BankPicker } from "@/components/teacher/bank/bank-picker";
import { requireTeacher } from "@/lib/auth/guards";
import { getTopics } from "@/lib/bank-data";
import { db } from "@/lib/db";
import { getTestAccess } from "@/lib/tests/access";

export const metadata: Metadata = { title: "Bankdan savol qo'shish" };

// Testni bankdan yig'ish (FEATURES.md, B qism): qo'lda yoki qoidalar bo'yicha
export default async function TestBankPage({
  params,
}: PageProps<"/teacher/tests/[id]/bank">) {
  const user = await requireTeacher();
  const { id } = await params;
  const access = await getTestAccess(user, id);
  if (!access?.canEdit) notFound();

  const [test, topics, questions] = await Promise.all([
    db.test.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        _count: { select: { groups: true } },
        questions: { select: { sourceBankQuestionId: true } },
      },
    }),
    getTopics(user.id),
    db.bankQuestion.findMany({
      where: { ownerId: user.id, archivedAt: null },
      orderBy: { createdAt: "desc" },
      take: 2000,
      select: {
        id: true,
        text: true,
        difficulty: true,
        topicId: true,
        points: true,
      },
    }),
  ]);
  if (!test) notFound();
  const inTest = new Set(test.questions.map((q) => q.sourceBankQuestionId));

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          prefetch={false}
          href={`/teacher/tests/${test.id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          {test.title}
        </Link>
        <h1 className="text-2xl font-semibold">Bankdan savol qo&apos;shish</h1>
        <p className="text-muted-foreground text-sm">
          Savollar testga nusxa qilib qo&apos;shiladi. Bankdagi savol keyin
          o&apos;zgarsa, bu test o&apos;zgarmaydi.
        </p>
      </div>
      {questions.length === 0 ? (
        <p className="text-muted-foreground">
          Bankingiz bo&apos;sh.{" "}
          <Link prefetch={false} href="/teacher/bank" className="underline">
            Savollar banki
          </Link>{" "}
          sahifasida savol qo&apos;shing yoki import qiling.
        </p>
      ) : (
        <BankPicker
          testId={test.id}
          topics={topics.map((t) => ({
            id: t.id,
            path: t.path,
            parentId: t.parentId,
          }))}
          questions={questions.map((q) => ({ ...q, inTest: inTest.has(q.id) }))}
          hasGroups={test._count.groups > 0}
        />
      )}
    </>
  );
}
