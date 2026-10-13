import { Fragment } from "react";
import type { Metadata } from "next";
import { ProgressChart } from "@/components/grades/progress-chart";
import { SemesterCard } from "@/components/grades/semester-card";
import { requireStudent } from "@/lib/auth/guards";
import { getStudentSemesters } from "@/lib/grades-data";
import { semesterProgress } from "@/lib/grades-progress";
import { todayInTashkent } from "@/lib/time";

export const metadata: Metadata = { title: "Baholarim" };

// O'quvchi faqat o'z ballarini ko'radi: natija faqat shu o'quvchi bilan quriladi
export default async function MyGradesPage() {
  const student = await requireStudent();
  const semesters = await getStudentSemesters(student.id);
  const today = todayInTashkent();

  return (
    <>
      <h1 className="text-2xl font-semibold">Baholarim</h1>
      {semesters.length === 0 ? (
        <p className="text-muted-foreground">Hozircha ballar yo&apos;q.</p>
      ) : (
        semesters.map((data) => {
          const me = data.students[0];
          return me ? (
            <Fragment key={data.semester.id}>
              <SemesterCard data={data} student={me} />
              <ProgressChart
                points={semesterProgress(data, me, today)}
                maxTotal={me.result.maxTotal}
                passScore={me.result.passScore}
              />
            </Fragment>
          ) : null;
        })
      )}
      <p className="text-muted-foreground text-xs">
        Testlar semestr baliga kirmaydi, ularning natijasi test sahifalarida.
      </p>
    </>
  );
}
