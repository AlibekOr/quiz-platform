import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { AttendanceSheet } from "@/components/teacher/attendance/attendance-sheet";
import { PenaltyDialog } from "@/components/teacher/penalties/penalty-dialog";
import { getLessonSheet } from "@/lib/attendance-data";
import { db } from "@/lib/db";
import { currentSemesterId } from "@/lib/grades-data";
import { getActivePenaltyTypes } from "@/lib/penalties";
import { canAccessGroup } from "@/lib/auth/scope";
import { requireTeacherScope } from "@/lib/auth/staff";
import {
  formatDate,
  isValidDateStr,
  todayInTashkent,
  weekdayLong,
  weekdayOf,
} from "@/lib/time";

export const metadata: Metadata = { title: "Davomat belgilash" };

export default async function AttendanceSheetPage({
  params,
}: PageProps<"/teacher/attendance/[groupId]/[date]">) {
  const { user, scope } = await requireTeacherScope();
  const { groupId, date } = await params;
  if (!isValidDateStr(date) || !canAccessGroup(scope, groupId)) notFound();

  const today = todayInTashkent();
  const sheet = await getLessonSheet(groupId, date);
  if (!sheet) notFound();

  const schedule = sheet.group.schedules.find(
    (s) => s.weekday === weekdayOf(date),
  );
  // Jarima: dars sanasi tushadigan semestrga (semestr bo'lmasa tugma chiqmaydi)
  const [semesterId, penaltyTypes] = await Promise.all([
    currentSemesterId(groupId, date),
    getActivePenaltyTypes(user.id),
  ]);
  const semester = semesterId
    ? await db.semester.findUnique({
        where: { id: semesterId },
        select: {
          id: true,
          name: true,
          categories: { where: { kind: "ORAL" }, select: { name: true } },
        },
      })
    : null;
  // Semestr shablonida og'zaki bo'lmasa — ustun chiqmaydi (semestrsiz kunda — chiqadi)
  const oralLabel = semester
    ? (semester.categories[0]?.name ?? null)
    : "Og'zaki";

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
          prefetch={false}
          href={`/teacher/attendance?date=${date}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon className="size-4" />
          Davomat
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{sheet.group.name}</h1>
          <p className="text-muted-foreground text-sm">
            {formatDate(date)}, {weekdayLong(weekdayOf(date)).toLowerCase()}
            {schedule
              ? ` · ${schedule.startTime}–${schedule.endTime}`
              : " · qo'shimcha dars"}
            {sheet.lesson ? " · saqlangan" : ""}
          </p>
        </div>
        {semester && date <= today && (
          <div>
            <PenaltyDialog
              students={sheet.rows
                .filter((r) => !r.formerMember)
                .map((r) => ({ id: r.studentId, fullName: r.fullName }))}
              semesters={[semester]}
              types={penaltyTypes}
              date={date}
            />
          </div>
        )}
      </div>

      {date > today ? (
        <p className="text-muted-foreground">
          Kelajakdagi sana uchun davomat belgilab bo&apos;lmaydi.
        </p>
      ) : sheet.rows.length === 0 ? (
        <p className="text-muted-foreground">
          Guruhda faol o&apos;quvchi yo&apos;q.
        </p>
      ) : (
        <AttendanceSheet
          key={`${groupId}:${date}`}
          groupId={sheet.group.id}
          date={date}
          topic={sheet.lesson?.topic ?? null}
          students={sheet.rows}
          oralLabel={oralLabel}
        />
      )}
    </>
  );
}
