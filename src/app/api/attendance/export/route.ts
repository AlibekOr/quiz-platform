import type { NextRequest } from "next/server";
import { attendanceFileName, buildAttendanceWorkbook } from "@/lib/attendance";
import { getAttendanceReport } from "@/lib/attendance-data";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate, formatSchedule, isValidDateStr } from "@/lib/time";

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_DAYS = 366;

// GET /api/attendance/export?groupId=&from=&to= — faqat o'qituvchi
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  if (user.role !== "TEACHER")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const groupId = params.get("groupId")?.slice(0, 64) ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (!groupId || !isValidDateStr(from) || !isValidDateStr(to) || from > to) {
    return Response.json(
      { error: "groupId, from va to (YYYY-MM-DD) kerak" },
      { status: 400 },
    );
  }
  if ((Date.parse(to) - Date.parse(from)) / 86_400_000 > MAX_DAYS) {
    return Response.json({ error: "Davr 1 yildan oshmasin" }, { status: 400 });
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    select: {
      name: true,
      schedules: { select: { weekday: true, startTime: true, endTime: true } },
    },
  });
  if (!group)
    return Response.json({ error: "Guruh topilmadi" }, { status: 404 });

  const report = await getAttendanceReport(groupId, from, to);
  const buffer = await buildAttendanceWorkbook(report, {
    groupName: group.name,
    schedule: formatSchedule(group.schedules),
    period: `${formatDate(from)} – ${formatDate(to)}`,
  });
  const filename = attendanceFileName(group.name, from, to);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
