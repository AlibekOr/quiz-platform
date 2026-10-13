import { formatPoints } from "@/lib/grades";
import type { ProgressPoint } from "@/lib/grades-progress";
import { formatDayMonth } from "@/lib/time";

// Semestr bali haftama-hafta: inline SVG (kutubxonasiz), ranglar mavzu tokenlaridan —
// qorong'i rejimda ham to'g'ri. viewBox bilan telefon kengligiga moslashadi

const W = 320;
const H = 150;
const PAD = { top: 12, right: 12, bottom: 22, left: 26 };
/** Sana yozuvlari orasidagi eng kichik masofa (viewBox birligida) */
const LABEL_GAP = 34;
const DAY_MS = 86_400_000;

export function ProgressChart({
  points,
  maxTotal,
  passScore,
}: {
  points: ProgressPoint[];
  maxTotal: number;
  passScore: number;
}) {
  if (points.length < 2) return null;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  // X — sanaga mutanosib (oxirgi oraliq qisqa bo'lishi mumkin)
  const days = points.map((p) => Date.parse(p.date) / DAY_MS);
  const span = days[days.length - 1] - days[0] || 1;
  const x = (i: number) => PAD.left + (innerW * (days[i] - days[0])) / span;
  const y = (v: number) => PAD.top + innerH * (1 - v / maxTotal);
  const line = points.map((p, i) => `${x(i)},${y(p.total)}`).join(" ");
  const area = `${x(0)},${y(0)} ${line} ${x(points.length - 1)},${y(0)}`;
  const lastIndex = points.length - 1;
  const last = points[lastIndex];
  // Birinchi va oxirgi sana doim; oradagilar oldingi yozuvdan va oxirgisidan uzoq bo'lsa
  const labeled = new Set([0, lastIndex]);
  let prevX = x(0);
  for (let i = 1; i < lastIndex; i++) {
    if (x(i) - prevX >= LABEL_GAP && x(lastIndex) - x(i) >= LABEL_GAP) {
      labeled.add(i);
      prevX = x(i);
    }
  }
  const label = `Semestr bali haftalar bo'yicha: ${points
    .map((p) => `${formatDayMonth(p.date)} — ${formatPoints(p.total)}`)
    .join(", ")} (${maxTotal} dan, o'tish ${passScore})`;

  return (
    <section className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold">Ball dinamikasi</h2>
        <span className="text-muted-foreground text-sm">
          hozir {formatPoints(last.total)} / {maxTotal}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={label}
      >
        {/* Y o'qi: 0, o'tish chegarasi, maksimum */}
        {[0, maxTotal].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              className="stroke-border"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 4}
              y={y(v) + 3}
              textAnchor="end"
              className="fill-muted-foreground text-[9px]"
            >
              {v}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(passScore)}
          y2={y(passScore)}
          className="stroke-amber-500"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <text
          x={PAD.left - 4}
          y={y(passScore) + 3}
          textAnchor="end"
          className="fill-amber-600 text-[9px] dark:fill-amber-400"
        >
          {passScore}
        </text>

        <polygon points={area} className="fill-primary/10" />
        <polyline
          points={line}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={x(i)}
            cy={y(p.total)}
            r={i === points.length - 1 ? 3.5 : 2.5}
            className="fill-primary"
          />
        ))}

        {/* X o'qi: bir-biriga yopishmaydigan sanalar */}
        {points.map((p, i) =>
          labeled.has(i) ? (
            <text
              key={p.date}
              x={x(i)}
              y={H - 6}
              textAnchor={
                i === 0 ? "start" : i === lastIndex ? "end" : "middle"
              }
              className="fill-muted-foreground text-[9px]"
            >
              {formatDayMonth(p.date)}
            </text>
          ) : null,
        )}
      </svg>
      <p className="text-muted-foreground text-xs">
        Har hafta oxiridagi jami ball. Sariq chiziq — o&apos;tish chegarasi:{" "}
        {passScore}.
      </p>
    </section>
  );
}
