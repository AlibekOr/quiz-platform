import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { GradeEntryForm } from "@/components/teacher/homework/grade-entry-form";
import { Badge } from "@/components/ui/badge";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { CATEGORY_LABEL, formatPoints, STATUS_LABEL } from "@/lib/grades";
import { getSemesterGrades } from "@/lib/grades-data";
import { departureLabel } from "@/lib/memberships";
import { formatDate, fromDbDate } from "@/lib/time";

export const metadata: Metadata = { title: "Ball qo'yish" };

export default async function AssignmentGradesPage({
  params,
}: PageProps<"/teacher/homework/[id]">) {
  await requireTeacher();
  const { id } = await params;

  const assignment = await db.assignment.findUnique({
    where: { id },
    select: {
      id: true,
      category: true,
      title: true,
      description: true,
      dueDate: true,
      maxPoints: true,
      semesterId: true,
    },
  });
  if (!assignment) notFound();
  const sheet = await getSemesterGrades(assignment.semesterId);
  if (!sheet) notFound();
  const { semester } = sheet;
  const isExtra = assignment.category === "EXTRA";

  const rows = sheet.students.map((s) => ({
    studentId: s.id,
    fullName: s.fullName,
    label: s.departure ? departureLabel(s.departure) : null,
    points: s.grades[assignment.id]?.points ?? null,
    note: s.grades[assignment.id]?.note ?? null,
    // Qo'shimcha ball faqat semestr tugagach va "Qo'shimcha imkoniyat"dagilarga
    blocked:
      isExtra && !s.result.canReceiveExtra
        ? `${STATUS_LABEL[s.result.status]} · ${formatPoints(s.result.withoutExtra)} ball`
        : null,
  }));

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={`/teacher/homework?group=${semester.group.id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Uyga vazifalar
        </Link>
        <h1 className="text-2xl font-semibold break-words">
          {assignment.title}
        </h1>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-1 text-sm">
          <Badge variant="secondary">
            {CATEGORY_LABEL[assignment.category]}
          </Badge>
          {semester.group.name} · {semester.name} · muddat{" "}
          {formatDate(fromDbDate(assignment.dueDate))} ·{" "}
          {assignment.category === "HOMEWORK"
            ? "0 / 0,5 / 1 ball"
            : `maksimal ${assignment.maxPoints} ball`}
        </p>
        {assignment.description && (
          <p className="text-sm whitespace-pre-wrap">
            {assignment.description}
          </p>
        )}
        {isExtra && !semester.ended && (
          <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
            Qo&apos;shimcha ball semestr tugagandan keyin qo&apos;yiladi
            (semestr {formatDate(semester.endDate)} da tugaydi yoki guruh
            sahifasida yopiladi).
          </p>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          Bu semestrda guruhda o&apos;quvchi bo&apos;lmagan.
        </p>
      ) : (
        <GradeEntryForm
          assignmentId={assignment.id}
          category={assignment.category}
          maxPoints={assignment.maxPoints}
          rows={rows}
        />
      )}
    </>
  );
}
