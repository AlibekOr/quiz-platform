import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { AttendanceSheet } from "@/components/teacher/attendance/attendance-sheet";
import { getLessonSheet } from "@/lib/attendance-data";
import { requireTeacher } from "@/lib/auth/guards";
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
  await requireTeacher();
  const { groupId, date } = await params;
  if (!isValidDateStr(date)) notFound();

  const today = todayInTashkent();
  const sheet = await getLessonSheet(groupId, date);
  if (!sheet) notFound();

  const schedule = sheet.group.schedules.find(
    (s) => s.weekday === weekdayOf(date),
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <Link
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
        />
      )}
    </>
  );
}
