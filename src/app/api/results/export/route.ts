import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { fileSafe } from "@/lib/format";
import { buildResultsCsv, defaultDir, sortRows } from "@/lib/results";
import { getTestResults } from "@/lib/results-data";
import { todayInTashkent } from "@/lib/time";
import { idParamSchema, resultsQuerySchema } from "@/lib/validators/results";

// GET /api/results/export?testId=&groupId=&sort=&dir= — test natijalari CSV, faqat o'qituvchi
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  if (user.role !== "TEACHER")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const testId = idParamSchema.safeParse(params.get("testId"));
  if (!testId.success)
    return Response.json({ error: "testId kerak" }, { status: 400 });
  const query = resultsQuerySchema.parse({
    groupId: params.get("groupId"),
    sort: params.get("sort"),
    dir: params.get("dir"),
  });

  const results = await getTestResults(testId.data, query.groupId);
  if (!results)
    return Response.json({ error: "Test topilmadi" }, { status: 404 });

  const rows = sortRows(
    results.rows,
    query.sort,
    query.dir ?? defaultDir(query.sort),
  );
  const filename = `natijalar_${fileSafe(results.test.title)}_${todayInTashkent()}.csv`;

  return new Response(buildResultsCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
