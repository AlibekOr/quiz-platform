export function percent(score: number, maxScore: number): number {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

/** Fayl nomi uchun xavfsiz qism: "Frontend-1" -> "Frontend-1", "A/B guruh" -> "A_B_guruh" */
export function fileSafe(name: string): string {
  return (
    name.replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "") || "guruh"
  );
}
