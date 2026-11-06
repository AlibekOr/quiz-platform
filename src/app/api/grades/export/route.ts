import type { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/guards";
import { getScope, semesterGroupInScope } from "@/lib/auth/scope";
import { getSemesterGrades } from "@/lib/grades-data";
import { buildGradesWorkbook, gradesFileName } from "@/lib/grades-excel";

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// GET /api/grades/export?periodId=<semestr id> — o'z guruhi o'qituvchisi yoki ADMIN
// (baholar menejerga yopiq). Doiradan tashqari semestr — 403
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "ADMIN")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const periodId = z
    .string()
    .min(1)
    .max(64)
    .safeParse(request.nextUrl.searchParams.get("periodId"));
  if (!periodId.success)
    return Response.json({ error: "periodId kerak" }, { status: 400 });

  if (!(await semesterGroupInScope(await getScope(user), periodId.data)))
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const data = await getSemesterGrades(periodId.data);
  if (!data)
    return Response.json({ error: "Semestr topilmadi" }, { status: 404 });

  const buffer = await buildGradesWorkbook(data);
  const filename = gradesFileName(data.semester.group.name, data.semester.name);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
