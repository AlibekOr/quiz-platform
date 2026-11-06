import Link from "next/link";
import { RiskList } from "@/components/risk/risk-list";
import type { RiskRow } from "@/lib/risk-data";

/** Bosh sahifadagi "Xavf ostidagi o'quvchilar" bloki: eng xavfli birinchi `limit` tasi */
export function RiskBlock({
  rows,
  limit,
  description,
  fullHref,
  studentHref,
}: {
  rows: RiskRow[];
  limit: number;
  description: string;
  /** To'liq ro'yxat sahifasi; null — havola yo'q */
  fullHref: string | null;
  studentHref: string | null;
}) {
  const active = rows.filter((r) => !r.reviewed).length;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="font-semibold">
            Xavf ostidagi o&apos;quvchilar
            {active > 0 && (
              <span className="text-muted-foreground ml-1 font-normal">
                ({active})
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {fullHref && rows.length > 0 && (
          <Link
            prefetch={false}
            href={fullHref}
            className="text-muted-foreground shrink-0 text-sm hover:underline"
          >
            Barchasi
          </Link>
        )}
      </div>
      <RiskList rows={rows.slice(0, limit)} studentHref={studentHref} />
    </section>
  );
}
