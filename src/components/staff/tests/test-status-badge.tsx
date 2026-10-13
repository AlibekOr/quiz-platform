import { Badge } from "@/components/ui/badge";
import { testState, type TestWindow } from "@/lib/tests/schedule";

const LABELS = {
  draft: { label: "Qoralama", variant: "secondary" },
  upcoming: { label: "Rejalashtirilgan", variant: "outline" },
  open: { label: "Faol", variant: "default" },
  closed: { label: "Yopilgan", variant: "secondary" },
} as const;

/** Test holati o'qituvchi/menejer uchun: faollik va ochiq bo'lish oralig'i birga */
export function TestStatusBadge({
  test,
  now,
}: {
  test: TestWindow;
  now: Date;
}) {
  const { label, variant } = LABELS[testState(test, now)];
  return <Badge variant={variant}>{label}</Badge>;
}
