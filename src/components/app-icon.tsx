// Ilova ikonkasi (app/icon.tsx, app/apple-icon.tsx): to'q fonda oq "belgilangan" katak.
// Fon butun maydonni egallaydi — Android "maskable" ikonkasi sifatida ham kesilmaydi

export function AppIcon({ size }: { size: number }) {
  const mark = Math.round(size * 0.5);
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#171717",
      }}
    >
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M8 12.5l3 3 5-6" />
      </svg>
    </div>
  );
}
