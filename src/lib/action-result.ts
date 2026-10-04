import { z } from "zod";

export type ActionResult =
  | { ok: true; message?: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

/** Zod xatosini formaga qaytariladigan natijaga aylantiradi */
export function validationFailed(error: z.ZodError): ActionResult {
  return {
    ok: false,
    error: "Maydonlarni tekshiring",
    fieldErrors: z.flattenError(error).fieldErrors as Record<
      string,
      string[] | undefined
    >,
  };
}
