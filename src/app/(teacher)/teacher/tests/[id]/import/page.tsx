import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ImportQuestions } from "@/components/teacher/tests/import-questions";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Savollarni import qilish" };

export default async function ImportQuestionsPage({
  params,
}: PageProps<"/teacher/tests/[id]/import">) {
  await requireTeacher();
  const { id } = await params;
  const test = await db.test.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!test) notFound();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={`/teacher/tests/${test.id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          {test.title}
        </Link>
        <h1 className="text-2xl font-semibold">Savollarni import qilish</h1>
      </div>
      <ImportQuestions testId={test.id} />
    </>
  );
}
