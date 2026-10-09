"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireTeacher } from "@/lib/auth/guards";
import { decideDeletionRequest } from "@/lib/deletion-requests";
import {
  deletionDecisionSchema,
  type DeletionDecisionInput,
} from "@/lib/validators/manager";

const idSchema = z.string().min(1).max(64);

/** Tasdiqlash o'quvchini arxivlaydi, rad etishda izoh majburiy (lib/deletion-requests.ts) */
export async function decideRequest(
  requestId: string,
  input: DeletionDecisionInput,
): Promise<ActionResult> {
  const teacher = await requireTeacher();
  const id = idSchema.parse(requestId);
  const parsed = deletionDecisionSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  const result = await decideDeletionRequest(teacher, id, parsed.data);
  if (result.ok) {
    revalidatePath("/teacher", "layout");
    revalidatePath("/manager", "layout");
  }
  return result;
}
