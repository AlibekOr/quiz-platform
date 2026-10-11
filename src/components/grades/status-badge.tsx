import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type SemesterStatus } from "@/lib/grades";

const STATUS_CLASS: Record<SemesterStatus, string> = {
  IN_PROGRESS: "",
  PASSED:
    "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  EXTRA_CHANCE:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  FAILED: "border-destructive/40 bg-destructive/10 text-destructive",
};

/** Semestr holati: Jarayonda / O'tdi / Qo'shimcha imkoniyat / Yiqildi */
export function StatusBadge({ status }: { status: SemesterStatus }) {
  return (
    <Badge variant="outline" className={STATUS_CLASS[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
