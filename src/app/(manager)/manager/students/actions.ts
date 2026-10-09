"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validationFailed, type ActionResult } from "@/lib/action-result";
import { requireManager } from "@/lib/auth/guards";
import { requestDeletion } from "@/lib/deletion-requests";
import {
  deletionRequestSchema,
  type DeletionRequestInput,
} from "@/lib/validators/manager";

const idSchema = z.string().min(1).max(64);

/** Menejer o'quvchini o'chira olmaydi — faqat so'raydi (doira lib/deletion-requests.ts da tekshiriladi) */
export async function requestStudentDeletion(
  studentId: string,
  input: DeletionRequestInput,
): Promise<ActionResult> {
  const manager = await requireManager();
  const id = idSchema.parse(studentId);
  const parsed = deletionRequestSchema.safeParse(input);
  if (!parsed.success) return validationFailed(parsed.error);

  const result = await requestDeletion(manager, id, parsed.data.reason);
  if (result.ok) {
    revalidatePath("/manager", "layout");
    revalidatePath("/teacher", "layout");
  }
  return result;
}
