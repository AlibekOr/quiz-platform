import { z } from "zod";

// Bu yerda maxsus format qoidalari yo'q: noto'g'ri login ham umumiy xabar bilan rad etiladi
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Loginni kiriting")
    .max(64, "Login yoki parol noto'g'ri"),
  password: z
    .string()
    .min(1, "Parolni kiriting")
    .max(128, "Login yoki parol noto'g'ri"),
});

export type LoginInput = z.input<typeof loginSchema>;
