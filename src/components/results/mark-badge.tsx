import { Badge } from "@/components/ui/badge";
import type { Mark } from "@/lib/grading";
import { MARK_LABEL } from "@/lib/results";
import { cn } from "@/lib/utils";

const MARK_CLASS: Record<Mark, string> = {
  5: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  4: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  fail: "border-destructive/50 bg-destructive/10 text-destructive",
};

/** Baho belgisi: 5 — yashil, 4 — sariq, o'tmadi — qizil */
export function MarkBadge({
  mark,
  className,
}: {
  mark: Mark;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(MARK_CLASS[mark], className)}>
      {MARK_LABEL[mark]}
    </Badge>
  );
}
