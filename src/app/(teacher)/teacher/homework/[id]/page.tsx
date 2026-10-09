import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { GradeEntryForm } from "@/components/teacher/homework/grade-entry-form";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { departureLabel, describeDeparture } from "@/lib/memberships";
import { membershipOverlapWhere } from "@/lib/memberships-data";
import { formatDate, fromDbDate } from "@/lib/time";

export const metadata: Metadata = { title: "Ball qo'yish" };

export default async function HomeworkGradesPage({
  params,
}: PageProps<"/teacher/homework/[id]">) {
  await requireTeacher();
  const { id } = await params;

  const homework = await db.homework.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      maxPoints: true,
      period: {
        select: {
          name: true,
          startDate: true,
          endDate: true,
          group: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!homework) notFound();
  const { period } = homework;
  const groupId = period.group.id;

  const students = await db.user.findMany({
    where: {
      role: "STUDENT",
      archivedAt: null,
      memberships: {
        some: membershipOverlapWhere(
          groupId,
          fromDbDate(period.startDate),
          fromDbDate(period.endDate),
        ),
      },
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      homeworkGrades: {
        where: { homeworkId: id },
        select: { points: true, note: true },
      },
      exemptions: {
        where: { itemType: "HOMEWORK", itemId: id },
        select: { reason: true },
      },
      memberships: {
        select: {
          groupId: true,
          joinedAt: true,
          leftAt: true,
          group: { select: { name: true } },
        },
      },
    },
  });

  const rows = students
    .map((s) => {
      const departure = describeDeparture(
        groupId,
        s.memberships.map((m) => ({
          groupId: m.groupId,
          groupName: m.group.name,
          joinedAt: m.joinedAt,
          leftAt: m.leftAt,
        })),
      );
      return {
        studentId: s.id,
        fullName: s.fullName,
        label: departure ? departureLabel(departure) : null,
        points: s.homeworkGrades[0]?.points ?? null,
        note: s.homeworkGrades[0]?.note ?? null,
        exempt: s.exemptions[0]?.reason ?? null,
      };
    })
    // Hozirgi a'zolar tepada
    .sort((a, b) => Number(a.label !== null) - Number(b.label !== null));

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          href={`/teacher/homework?group=${groupId}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Uyga vazifalar
        </Link>
        <h1 className="text-2xl font-semibold break-words">{homework.title}</h1>
        <p className="text-muted-foreground text-sm">
          {period.group.name} · {period.name} · muddat{" "}
          {formatDate(fromDbDate(homework.dueDate))} · maksimal{" "}
          {homework.maxPoints} ball
        </p>
        {homework.description && (
          <p className="text-sm whitespace-pre-wrap">{homework.description}</p>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">
          Bu davrda guruhda o&apos;quvchi bo&apos;lmagan.
        </p>
      ) : (
        <GradeEntryForm
          homeworkId={homework.id}
          maxPoints={homework.maxPoints}
          rows={rows}
        />
      )}
    </>
  );
}
