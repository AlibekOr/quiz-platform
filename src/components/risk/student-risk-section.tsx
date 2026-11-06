import { RiskList } from "@/components/risk/risk-list";
import { SIGNAL_LABEL } from "@/lib/risk";
import type { RiskReviewEntry, RiskRow } from "@/lib/risk-data";
import { formatDate, formatDateTime } from "@/lib/time";

/** O'quvchi kartochkasi: joriy xavf signallari va "Ko'rib chiqildi" tarixi */
export function StudentRiskSection({
  row,
  history,
}: {
  row: RiskRow | null;
  history: RiskReviewEntry[];
}) {
  if (!row && history.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Xavf signallari</h2>
      {row ? (
        <RiskList rows={[row]} studentHref={null} />
      ) : (
        <p className="text-muted-foreground text-sm">
          Hozir xavf signali yo&apos;q.
        </p>
      )}
      {history.length > 0 && (
        <ul className="divide-y rounded-lg border text-sm">
          {history.map((h) => (
            <li key={h.id} className="flex flex-col gap-0.5 p-3">
              <span className="text-muted-foreground text-xs tabular-nums">
                {formatDateTime(h.createdAt)} · {h.reviewer} ·{" "}
                {formatDate(h.hideUntil)} gacha
              </span>
              {h.note && <span>{h.note}</span>}
              {h.signalKinds.length > 0 && (
                <span className="text-muted-foreground text-xs">
                  {h.signalKinds.map((k) => SIGNAL_LABEL[k]).join(", ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
