import type { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { buildStatsWorkbook, getTeacherStats } from "@/lib/admin-stats";

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const idParam = z
  .string()
  .max(64)
  .nullish()
  .transform((v) => v || null);

// GET /api/admin/stats?region=&teacher= — faqat ADMIN
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  if (user.role !== "ADMIN")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const search = request.nextUrl.searchParams;
  const rows = await getTeacherStats({
    regionId: idParam.parse(search.get("region")),
    teacherId: idParam.parse(search.get("teacher")),
  });
  const buffer = await buildStatsWorkbook(rows);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": 'attachment; filename="statistika.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
