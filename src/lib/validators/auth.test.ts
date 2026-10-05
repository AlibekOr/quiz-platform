import { describe, expect, it } from "vitest";
import { changePasswordSchema } from "./auth";

const messages = (input: Parameters<typeof changePasswordSchema.parse>[0]) => {
  const r = changePasswordSchema.safeParse(input);
  return r.success
    ? []
    : r.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`);
};

describe("changePasswordSchema", () => {
  it("to'g'ri qiymatlar o'tadi", () => {
    expect(
      messages({
        currentPassword: "eski-parol",
        newPassword: "yangi-parol-1",
        confirmPassword: "yangi-parol-1",
      }),
    ).toEqual([]);
  });

  it("qisqa, mos kelmagan va eskisi bilan bir xil parol rad etiladi", () => {
    expect(
      messages({
        currentPassword: "x",
        newPassword: "qisqa",
        confirmPassword: "qisqa",
      }),
    ).toEqual(["newPassword: Yangi parol kamida 8 belgi"]);
    expect(
      messages({
        currentPassword: "eski-parol",
        newPassword: "yangi-parol-1",
        confirmPassword: "yangi-parol-2",
      }),
    ).toEqual(["confirmPassword: Parollar mos kelmadi"]);
    expect(
      messages({
        currentPassword: "bir-xil-parol",
        newPassword: "bir-xil-parol",
        confirmPassword: "bir-xil-parol",
      }),
    ).toEqual(["newPassword: Yangi parol eskisidan farq qilsin"]);
  });
});
