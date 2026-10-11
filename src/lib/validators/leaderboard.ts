import { z } from "zod";

const id = z.string().trim().min(1).max(64);

/**
 * GET /api/leaderboard va reyting sahifalari query parametrlari.
 * Noto'g'ri yoki bo'sh qiymatlar standartga tushadi (scope → "group", id → null).
 */
export const leaderboardQuerySchema = z.object({
  testId: id.nullish().catch(null),
  scope: z.enum(["group", "all"]).catch("group"),
  groupId: id.nullish().catch(null),
  /** testId bo'lmasa: "tests" — barcha testlar yig'indisi (Testlar bo'limi), aks holda semestr bali */
  board: z.enum(["semester", "tests"]).catch("semester"),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
