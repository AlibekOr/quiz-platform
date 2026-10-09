import { Badge } from "@/components/ui/badge";

type Status = "PENDING" | "APPROVED" | "REJECTED";

/** O'chirish so'rovi holati (o'qituvchi va menejer sahifalari) */
export function RequestStatusBadge({ status }: { status: Status }) {
  if (status === "PENDING") return <Badge>Kutilmoqda</Badge>;
  if (status === "APPROVED")
    return <Badge variant="secondary">Tasdiqlangan</Badge>;
  return <Badge variant="outline">Rad etilgan</Badge>;
}
