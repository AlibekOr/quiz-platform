import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { ImportStudents } from "@/components/teacher/students/import-students";
import { requireManager } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "O'quvchilarni import qilish" };

// Fayldagi guruhlar menejer doirasida bo'lishi shart (server qayta tekshiradi)
export default async function ManagerImportStudentsPage() {
  await requireManager();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href="/manager/students"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          O&apos;quvchilar
        </Link>
        <h1 className="text-2xl font-semibold">Excel&apos;dan import</h1>
        <p className="text-muted-foreground text-sm">
          Faqat sizga biriktirilgan guruhlarga qo&apos;shish mumkin.
        </p>
      </div>
      <ImportStudents returnTo="/manager/students" />
    </>
  );
}
