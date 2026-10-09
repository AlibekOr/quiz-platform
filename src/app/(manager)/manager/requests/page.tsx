import type { Metadata } from "next";
import { RequestStatusBadge } from "@/components/manager/request-status-badge";
import { requireManager } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/time";

export const metadata: Metadata = { title: "So'rovlarim" };

// Menejer faqat o'zi yuborgan so'rovlarni ko'radi
export default async function ManagerRequestsPage() {
  const manager = await requireManager();
  const requests = await db.deletionRequest.findMany({
    where: { requestedById: manager.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      reason: true,
      status: true,
      decisionNote: true,
      decidedAt: true,
      createdAt: true,
      student: {
        select: { fullName: true, group: { select: { name: true } } },
      },
    },
  });

  return (
    <>
      <h1 className="text-2xl font-semibold">So&apos;rovlarim</h1>
      {requests.length === 0 ? (
        <p className="text-muted-foreground">
          Hali so&apos;rov yubormagansiz. O&apos;quvchini o&apos;chirishni
          &quot;O&apos;quvchilar&quot; sahifasidagi amallar menyusidan
          so&apos;rash mumkin.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {requests.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {r.student.fullName}
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    · {r.student.group?.name ?? "guruhsiz"}
                  </span>
                </span>
                <RequestStatusBadge status={r.status} />
              </div>
              <p>Sabab: {r.reason}</p>
              {r.decisionNote && (
                <p className="text-muted-foreground">
                  O&apos;qituvchi izohi: {r.decisionNote}
                </p>
              )}
              <p className="text-muted-foreground text-xs">
                Yuborilgan: {formatDateTime(r.createdAt)}
                {r.decidedAt && ` · hal qilingan: ${formatDateTime(r.decidedAt)}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
