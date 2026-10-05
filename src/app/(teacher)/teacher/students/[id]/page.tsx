import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PhoneIcon, SendIcon } from "lucide-react";
import { StudentRowActions } from "@/components/teacher/students/student-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computeStats } from "@/lib/attendance";
import { finalizeExpiredAttempts } from "@/lib/attempts";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { percent } from "@/lib/format";
import { formatPhone } from "@/lib/students/format";
import { teacherProfileSelect } from "@/lib/students/profile-select";
import { formatDateTime, formatDuration } from "@/lib/time";
import { PARENT_RELATION_LABELS, telegramUrl } from "@/lib/validators/contact";

export const metadata: Metadata = { title: "O'quvchi" };

export default async function StudentCardPage({
  params,
}: PageProps<"/teacher/students/[id]">) {
  await requireTeacher();
  const { id } = await params;
  await finalizeExpiredAttempts({ userId: id });

  const [student, groups] = await Promise.all([
    db.user.findFirst({
      where: { id, role: "STUDENT" },
      select: {
        id: true,
        fullName: true,
        username: true,
        isActive: true,
        groupId: true,
        createdAt: true,
        group: { select: { name: true } },
        profile: { select: teacherProfileSelect },
        attendances: { select: { status: true } },
        attempts: {
          orderBy: { startedAt: "desc" },
          select: {
            id: true,
            status: true,
            isFirst: true,
            score: true,
            maxScore: true,
            durationSec: true,
            startedAt: true,
            test: { select: { id: true, title: true } },
          },
        },
      },
    }),
    db.group.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!student) notFound();

  const { profile } = student;
  const row = {
    id: student.id,
    fullName: student.fullName,
    username: student.username,
    isActive: student.isActive,
    groupId: student.groupId,
    groupName: student.group?.name ?? null,
    profile,
  };
  const attendance = computeStats(student.attendances.map((a) => a.status));
  const finished = student.attempts.filter(
    (a) => a.status !== "IN_PROGRESS" && a.isFirst,
  );
  const avg =
    finished.length > 0
      ? Math.round(
          finished.reduce(
            (sum, a) => sum + percent(a.score ?? 0, a.maxScore ?? 0),
            0,
          ) / finished.length,
        )
      : null;

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
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold break-words">
                {student.fullName}
              </h1>
              {student.isActive ? (
                <Badge variant="secondary">Faol</Badge>
              ) : (
                <Badge variant="destructive">Bloklangan</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              <span className="font-mono">{student.username}</span> ·{" "}
              {student.group?.name ?? "Guruhsiz"}
            </p>
          </div>
          <StudentRowActions student={row} groups={groups} />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="font-semibold">O&apos;quvchi</h2>
          <ContactLine label="Telefon" phone={profile?.phone} />
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="text-muted-foreground">Telegram</span>
            {profile?.telegram ? (
              <a
                href={telegramUrl(profile.telegram)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-2 font-medium hover:underline"
              >
                <SendIcon className="size-4" />
                {profile.telegram.startsWith("@")
                  ? profile.telegram
                  : formatPhone(profile.telegram)}
              </a>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="font-semibold">Ota-ona</h2>
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="text-muted-foreground">Ismi</span>
            <span>
              {profile?.parentName ?? "—"}
              {profile?.parentRelation && (
                <span className="text-muted-foreground">
                  {" "}
                  ({PARENT_RELATION_LABELS[profile.parentRelation]})
                </span>
              )}
            </span>
          </div>
          <ContactLine label="Telefon" phone={profile?.parentPhone} />
        </div>
        <div className="flex flex-col gap-1 rounded-lg border p-4 text-sm md:col-span-2">
          <h2 className="font-semibold">Davomat</h2>
          {attendance.total === 0 ? (
            <p className="text-muted-foreground">Hali davomat belgilanmagan.</p>
          ) : (
            <p>
              <b className="text-lg tabular-nums">{attendance.percent}%</b>{" "}
              <span className="text-muted-foreground">
                · {attendance.total} ta darsdan {attendance.present} tasiga
                kelgan
                {attendance.late > 0 && ` (${attendance.late} marta kechikkan)`}
                , {attendance.absent} ta qoldirgan
              </span>
            </p>
          )}
        </div>
        {profile?.note && (
          <div className="flex flex-col gap-1 rounded-lg border p-4 text-sm md:col-span-2">
            <h2 className="font-semibold">Izoh</h2>
            <p className="whitespace-pre-wrap">{profile.note}</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Test natijalari</h2>
          {avg !== null && (
            <p className="text-muted-foreground text-sm">
              O&apos;rtacha (birinchi urinishlar):{" "}
              <b className="text-foreground">{avg}%</b>
            </p>
          )}
        </div>
        {student.attempts.length === 0 ? (
          <p className="text-muted-foreground">Hali test ishlamagan.</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead className="text-right">Ball</TableHead>
                  <TableHead className="text-right">Vaqt</TableHead>
                  <TableHead>Sana</TableHead>
                  <TableHead>Holat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.attempts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/teacher/tests/${a.test.id}`}
                        className="hover:underline"
                      >
                        {a.test.title}
                      </Link>
                      {!a.isFirst && (
                        <span className="text-muted-foreground"> · qayta</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <Link
                        href={`/teacher/tests/${a.test.id}/results/${a.id}`}
                        className="hover:underline"
                      >
                        {a.status === "IN_PROGRESS"
                          ? "—"
                          : `${a.score}/${a.maxScore}`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {a.durationSec === null
                        ? "—"
                        : formatDuration(a.durationSec)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(a.startedAt)}
                    </TableCell>
                    <TableCell>
                      {a.status === "IN_PROGRESS" ? (
                        <Badge>Davom etmoqda</Badge>
                      ) : a.status === "EXPIRED" ? (
                        <Badge variant="outline">Vaqt tugagan</Badge>
                      ) : (
                        <Badge variant="secondary">Topshirilgan</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}

function ContactLine({
  label,
  phone,
}: {
  label: string;
  phone: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="text-primary flex items-center gap-2 font-medium hover:underline"
        >
          <PhoneIcon className="size-4" />
          {formatPhone(phone)}
        </a>
      ) : (
        <span>—</span>
      )}
    </div>
  );
}
