import type { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { getPeriodGrades } from "@/lib/grades-data";
import { buildGradesWorkbook, gradesFileName } from "@/lib/grades-excel";

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// GET /api/grades/export?periodId= — faqat o'qituvchi
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  if (user.role !== "TEACHER")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const periodId = z
    .string()
    .min(1)
    .max(64)
    .safeParse(request.nextUrl.searchParams.get("periodId"));
  if (!periodId.success)
    return Response.json({ error: "periodId kerak" }, { status: 400 });

  const data = await getPeriodGrades(periodId.data);
  if (!data) return Response.json({ error: "Davr topilmadi" }, { status: 404 });

  const { period, sheet } = data;
  const buffer = await buildGradesWorkbook(sheet, {
    groupName: period.group.name,
    periodName: period.name,
    from: period.startDate,
    to: period.endDate,
  });
  const filename = gradesFileName(period.group.name, period.name);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
