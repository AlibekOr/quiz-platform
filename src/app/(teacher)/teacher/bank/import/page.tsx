import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { ImportQuestions } from "@/components/teacher/tests/import-questions";
import { requireTeacherScope } from "@/lib/auth/staff";
import { getTopics } from "@/lib/bank-data";

export const metadata: Metadata = { title: "Bankka import" };

// Mavjud JSON/Excel formatlari + ixtiyoriy topic va difficulty ustunlari
export default async function BankImportPage() {
  const { user } = await requireTeacherScope();
  const topics = await getTopics(user.id);
  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          prefetch={false}
          href="/teacher/bank"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Savollar banki
        </Link>
        <h1 className="text-2xl font-semibold">Bankka import qilish</h1>
      </div>
      {topics.length === 0 ? (
        <p className="text-muted-foreground">
          Avval bank sahifasida kamida bitta mavzu yarating.
        </p>
      ) : (
        <ImportQuestions
          target={{
            kind: "bank",
            topics: topics.map((t) => ({ id: t.id, path: t.path })),
          }}
        />
      )}
    </>
  );
}
