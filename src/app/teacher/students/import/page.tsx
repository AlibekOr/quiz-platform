import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { ImportStudents } from "@/components/teacher/students/import-students";
import { requireTeacher } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "O'quvchilarni import qilish" };

export default async function ImportStudentsPage() {
  await requireTeacher();

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href="/teacher/students"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          O&apos;quvchilar
        </Link>
        <h1 className="text-2xl font-semibold">Excel&apos;dan import</h1>
      </div>
      <ImportStudents />
    </>
  );
}
