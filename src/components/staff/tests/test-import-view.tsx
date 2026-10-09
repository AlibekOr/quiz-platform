import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ImportQuestions } from "@/components/teacher/tests/import-questions";
import type { CurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getTestAccess, staffBase } from "@/lib/tests/access";

/** Savollar importi: faqat testni tahrirlay oladiganlar uchun */
export async function TestImportView({
  user,
  id,
}: {
  user: CurrentUser;
  id: string;
}) {
  const access = await getTestAccess(user, id);
  if (!access?.canEdit) notFound();
  const base = staffBase(user.role);
  const test = await db.test.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!test) notFound();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={`${base}/tests/${test.id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          {test.title}
        </Link>
        <h1 className="text-2xl font-semibold">Savollarni import qilish</h1>
      </div>
      <ImportQuestions testId={test.id} basePath={base} />
    </>
  );
}
