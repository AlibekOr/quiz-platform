import type { Metadata } from "next";
import Link from "next/link";
import { RequestStatusBadge } from "@/components/manager/request-status-badge";
import { RequestDecision } from "@/components/teacher/requests/request-decision";
import { requireTeacher } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "So'rovlar" };

// Menejerlarning o'chirish so'rovlari: kutilayotganlar tepada
export default async function RequestsPage() {
  await requireTeacher();
  const requests = await db.deletionRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 300,
    select: {
      id: true,
      reason: true,
      status: true,
      decisionNote: true,
      decidedAt: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          fullName: true,
          archivedAt: true,
          group: { select: { name: true } },
        },
      },
      requestedBy: { select: { fullName: true } },
      decidedBy: { select: { fullName: true } },
    },
  });
  // enum tartibi PENDING, APPROVED, REJECTED — kutilayotganlar baribir birinchi
  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");

  return (
    <>
      <h1 className="text-2xl font-semibold">So&apos;rovlar</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          Kutilayotganlar ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Kutilayotgan so&apos;rov yo&apos;q.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {pending.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <span>
                    <Link
                      href={`/teacher/students/${r.student.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.student.fullName}
                    </Link>
                    <span className="text-muted-foreground">
                      {" "}
                      · {r.student.group?.name ?? "guruhsiz"}
                    </span>
                  </span>
                  <span>Sabab: {r.reason}</span>
                  <span className="text-muted-foreground text-xs">
                    {r.requestedBy.fullName} · {formatDateTime(r.createdAt)}
                  </span>
                </div>
                <RequestDecision
                  requestId={r.id}
                  studentName={r.student.fullName}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {decided.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Hal qilinganlar</h2>
          <ul className="divide-y rounded-lg border">
            {decided.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/teacher/students/${r.student.id}`}
                    className="font-medium hover:underline"
                  >
                    {r.student.fullName}
                  </Link>
                  <RequestStatusBadge status={r.status} />
                </div>
                <span>Sabab: {r.reason}</span>
                {r.decisionNote && (
                  <span className="text-muted-foreground">
                    Izoh: {r.decisionNote}
                  </span>
                )}
                <span className="text-muted-foreground text-xs">
                  {r.requestedBy.fullName} · {formatDateTime(r.createdAt)}
                  {r.decidedAt &&
                    ` · ${r.decidedBy?.fullName ?? "o'qituvchi"}, ${formatDateTime(r.decidedAt)}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
