"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

type FormAction = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

/** useActionState + muvaffaqiyatda toast va onSuccess (masalan, dialogni yopish) */
export function useFormAction(action: FormAction, onSuccess?: () => void) {
  return useActionState<ActionResult | null, FormData>(
    async (prev, formData) => {
      const result = await action(prev, formData);
      if (result.ok) {
        if (result.message) toast.success(result.message);
        onSuccess?.();
      }
      return result;
    },
    null,
  );
}

export function fieldError(
  state: ActionResult | null,
  field: string,
): string | undefined {
  return state && !state.ok ? state.fieldErrors?.[field]?.[0] : undefined;
}

export function formError(state: ActionResult | null): string | undefined {
  return state && !state.ok && !state.fieldErrors ? state.error : undefined;
}
