import "server-only";
import { getUploadedFile, readFirstSheet } from "@/lib/excel";
import {
  parseJsonQuestions,
  sheetToQuestions,
  type ParseResult,
} from "@/lib/tests/import";

/** Yuklangan savollar fayli (.xlsx yoki .json) — test va bank importi uchun */
export async function parseQuestionFile(
  formData: FormData,
): Promise<ParseResult> {
  const upload = getUploadedFile(formData, ["xlsx", "json"]);
  if ("error" in upload) return upload;
  if (upload.kind === "json")
    return parseJsonQuestions(await upload.file.text());
  const sheet = await readFirstSheet(upload.file);
  if ("error" in sheet) return sheet;
  return sheetToQuestions(sheet);
}
