import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PhoneIcon } from "lucide-react";
import { GradeEntryForm } from "@/components/teacher/homework/grade-entry-form";
import { Badge } from "@/components/ui/badge";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { CATEGORY_LABEL, formatPoints, STATUS_LABEL } from "@/lib/grades";
import { getSemesterGrades } from "@/lib/grades-data";
import { homeworkStatus } from "@/lib/homework";
import { departureLabel } from "@/lib/memberships";
import { formatPhone } from "@/lib/students/format";
import { formatDate, fromDbDate, todayInTashkent } from "@/lib/time";

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
  const today = todayInTashkent();
  const dueDate = fromDbDate(assignment.dueDate);

  // Kim bajardi / bajarmadi (faqat hozirgi a'zolar; ota-ona telefoni — faqat o'qituvchiga)
  const current = sheet.students.filter((s) => s.departure === null);
  const statuses = current.map((s) => ({
    student: s,
    status: homeworkStatus(
      s.grades[assignment.id]?.points ?? null,
      dueDate,
      today,
    ),
  }));
  const done = statuses.filter((x) => x.status === "DONE").length;
  const missed = statuses.filter((x) => x.status === "MISSED");
  const parents = await db.studentProfile.findMany({
    where: { userId: { in: missed.map((m) => m.student.id) } },
    select: { userId: true, parentName: true, parentPhone: true },
  });
  const parentOf = new Map(parents.map((p) => [p.userId, p]));

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
          prefetch={false}
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
          {semester.group.name} · {semester.name} · muddat {formatDate(dueDate)}{" "}
          ·{" "}
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

      {!isExtra && current.length > 0 && (
        <section className="flex flex-col gap-2 rounded-lg border p-3">
          <p className="text-sm">
            <b className="tabular-nums">
              {done} / {current.length}
            </b>{" "}
            bajardi
            {missed.length > 0 && (
              <span className="text-destructive">
                {" "}
                · {missed.length} ta bajarmagan
              </span>
            )}
          </p>
          {missed.length > 0 && (
            <ul className="flex flex-col divide-y text-sm">
              {missed.map(({ student }) => {
                const parent = parentOf.get(student.id);
                return (
                  <li
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-1.5"
                  >
                    <span className="font-medium">{student.fullName}</span>
                    {parent?.parentPhone ? (
                      <a
                        href={`tel:${parent.parentPhone}`}
                        className="text-primary flex items-center gap-1.5 hover:underline"
                      >
                        <PhoneIcon className="size-4" />
                        {parent.parentName ?? "Ota-onasi"}:{" "}
                        {formatPhone(parent.parentPhone)}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        ota-ona telefoni yo&apos;q
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

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
