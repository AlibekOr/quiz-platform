import type { Metadata } from "next";
import { SemesterCard } from "@/components/grades/semester-card";
import { requireStudent } from "@/lib/auth/guards";
import { getStudentSemesters } from "@/lib/grades-data";

export const metadata: Metadata = { title: "Baholarim" };

// O'quvchi faqat o'z ballarini ko'radi: natija faqat shu o'quvchi bilan quriladi
export default async function MyGradesPage() {
  const student = await requireStudent();
  const semesters = await getStudentSemesters(student.id);

  return (
    <>
      <h1 className="text-2xl font-semibold">Baholarim</h1>
      {semesters.length === 0 ? (
        <p className="text-muted-foreground">Hozircha ballar yo&apos;q.</p>
      ) : (
        semesters.map((data) => {
          const me = data.students[0];
          return me ? (
            <SemesterCard key={data.semester.id} data={data} student={me} />
          ) : null;
        })
      )}
      <p className="text-muted-foreground text-xs">
        Testlar semestr baliga kirmaydi, ularning natijasi test sahifalarida.
      </p>
    </>
  );
}
