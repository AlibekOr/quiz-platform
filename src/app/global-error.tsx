"use client";

// Root layout ham yiqilganda: o'z <html>/<body> si bilan, global CSS'siz ishlaydi
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: 16,
          textAlign: "center",
        }}
      >
        <title>Xato · Test platformasi</title>
        <div style={{ maxWidth: 400 }}>
          <h1 style={{ fontSize: 20 }}>Nimadir xato ketdi</h1>
          <p style={{ color: "#666", fontSize: 14 }}>
            Sahifani yuklab bo&apos;lmadi. Birozdan keyin qayta urinib
            ko&apos;ring.
          </p>
          {error.digest && (
            <p style={{ color: "#999", fontSize: 12, fontFamily: "monospace" }}>
              Xato kodi: {error.digest}
            </p>
          )}
          <button
            onClick={() => retry()}
            style={{
              marginTop: 8,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#111",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Qayta urinish
          </button>
        </div>
      </body>
    </html>
  );
}
