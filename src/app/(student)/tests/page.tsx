import type { Metadata } from "next";
import { StudentTests } from "@/components/student/student-tests";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireStudent } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Testlarim" };

// Yon paneldagi "Testlar → Testlarim": guruhga biriktirilgan testlar va natijalar
export default async function StudentTestsPage() {
  const student = await requireStudent();
  await finalizeExpiredAttempts({ userId: student.id });
  return (
    <>
      <h1 className="text-2xl font-semibold">Testlarim</h1>
      <StudentTests student={student} />
    </>
  );
}
