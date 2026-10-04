"use client";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ActionResult } from "@/lib/action-result";

/** Server action xatolarini formaga qo'yadi: maydon xatolari maydon ostiga, qolgani root.server ga */
export function applyServerErrors<T extends FieldValues>(
  form: { setError: UseFormSetError<T> },
  result: ActionResult,
) {
  if (result.ok) return;
  const fieldErrors = Object.entries(result.fieldErrors ?? {}).filter(
    ([, messages]) => messages?.length,
  );
  if (fieldErrors.length === 0) {
    form.setError("root.server", { message: result.error });
    return;
  }
  for (const [field, messages] of fieldErrors) {
    form.setError(field as Path<T>, { message: messages![0] });
  }
}
