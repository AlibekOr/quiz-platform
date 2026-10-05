import { z } from "zod";
import { RESULT_SORTS } from "@/lib/results";

const id = z.string().trim().min(1).max(64);
/** Bo'sh yoki noto'g'ri qiymat → null */
const optional = <T extends z.ZodType>(schema: T) =>
  schema
    .nullish()
    .catch(null)
    .transform((v) => v ?? null);

/** /teacher/tests/[id]/results va CSV eksport query parametrlari. Noto'g'ri qiymat standartga tushadi */
export const resultsQuerySchema = z.object({
  groupId: optional(id),
  sort: z.enum(RESULT_SORTS).catch("first"),
  dir: optional(z.enum(["asc", "desc"])),
});

export type ResultsQuery = z.infer<typeof resultsQuerySchema>;

/** testId / attemptId kabi identifikatorlar */
export const idParamSchema = id;
