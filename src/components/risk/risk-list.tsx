"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PhoneIcon } from "lucide-react";
import { toast } from "sonner";
import { markReviewed } from "@/app/(teacher)/teacher/risk/actions";
import { FormError, FormField } from "@/components/common/form-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LEVEL_LABEL } from "@/lib/risk";
import type { RiskRow } from "@/lib/risk-data";
import { formatDate } from "@/lib/time";
import { cn } from "@/lib/utils";

/**
 * Xavf ostidagi o'quvchilar ro'yxati: daraja, signal yorliqlari (sababi bilan), ota-ona
 * telefoni, "Ko'rib chiqildi". Ko'rib chiqilganlar kulrang va pastda
 */
export function RiskList({
  rows,
  studentHref,
}: {
  rows: RiskRow[];
  /** O'quvchi kartochkasi yo'li (prefiks); null — havola yo'q */
  studentHref: string | null;
}) {
  const [reviewing, setReviewing] = useState<RiskRow | null>(null);
  if (rows.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        Xavf ostidagi o&apos;quvchi yo&apos;q.
      </p>
    );
  return (
    <>
      <ul className="divide-y rounded-lg border text-sm">
        {rows.map((r) => (
          <li
            key={r.studentId}
            className={cn(
              "flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between",
              r.reviewed && "text-muted-foreground opacity-70",
            )}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    r.risk.level === "HIGH" && !r.reviewed
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {r.risk.level ? LEVEL_LABEL[r.risk.level] : ""}
                </Badge>
                {studentHref ? (
                  <Link
                    prefetch={false}
                    href={`${studentHref}/${r.studentId}`}
                    className="font-medium hover:underline"
                  >
                    {r.fullName}
                  </Link>
                ) : (
                  <span className="font-medium">{r.fullName}</span>
                )}
                <span className="text-muted-foreground text-xs">
                  {r.groupName}
                </span>
              </span>
              <span className="flex flex-wrap gap-1">
                {r.risk.signals.map((s) => (
                  <span
                    key={s.kind}
                    title={s.detail}
                    className="bg-muted rounded px-1.5 py-0.5 text-xs"
                  >
                    {s.label}: {s.detail}
                  </span>
                ))}
              </span>
              {r.reviewed && (
                <span className="text-xs">
                  Ko&apos;rib chiqilgan ({formatDate(r.reviewed.hideUntil)}{" "}
                  gacha)
                  {r.reviewed.note && ` — ${r.reviewed.note}`}
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {r.parentPhone && (
                <a
                  href={`tel:${r.parentPhone}`}
                  className="hover:bg-muted inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                >
                  <PhoneIcon className="size-3.5" />
                  Ota-ona
                </a>
              )}
              {!r.reviewed && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReviewing(r)}
                >
                  Ko&apos;rib chiqildi
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {reviewing && (
        <ReviewDialog row={reviewing} onClose={() => setReviewing(null)} />
      )}
    </>
  );
}

function ReviewDialog({ row, onClose }: { row: RiskRow; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [days, setDays] = useState(7);
  const [error, setError] = useState<string>();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ko&apos;rib chiqildi: {row.fullName}</DialogTitle>
          <DialogDescription>
            Shu muddatgacha ro&apos;yxatda pastda turadi. Yangi signal paydo
            bo&apos;lsa — darhol yana yuqoriga chiqadi.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await markReviewed(row.studentId, { note, days });
              if (result.ok) {
                toast.success(result.message);
                onClose();
              } else setError(result.error);
            });
          }}
        >
          <FormField id="review-note" label="Izoh (ixtiyoriy)">
            <Input
              id="review-note"
              maxLength={300}
              placeholder="Ota-onasi bilan gaplashildi"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>
          <FormField id="review-days" label="Necha kunga">
            <Input
              id="review-days"
              type="number"
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </FormField>
          <FormError message={error} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
