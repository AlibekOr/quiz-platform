import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { fileSafe } from "@/lib/format";
import { buildStudentsWorkbook } from "@/lib/students/export";
import { teacherProfileSelect } from "@/lib/students/profile-select";

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// GET /api/students/export?groupId= — faqat o'qituvchi. groupId berilmasa barcha o'quvchilar
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  if (user.role !== "TEACHER")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const groupId =
    request.nextUrl.searchParams.get("groupId")?.slice(0, 64) || null;
  const group = groupId
    ? await db.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      })
    : null;
  if (groupId && !group)
    return Response.json({ error: "Guruh topilmadi" }, { status: 404 });

  const students = await db.user.findMany({
    where: { role: "STUDENT", ...(groupId ? { groupId } : {}) },
    orderBy: [{ group: { name: "asc" } }, { fullName: "asc" }],
    select: {
      fullName: true,
      username: true,
      isActive: true,
      group: { select: { name: true } },
      profile: { select: teacherProfileSelect },
    },
  });

  const name = group ? group.name : "barcha";
  const buffer = await buildStudentsWorkbook(
    students.map(({ group: g, ...s }) => ({
      ...s,
      groupName: g?.name ?? null,
    })),
    `O'quvchilar — ${name}`,
  );
  const filename = `oquvchilar_${fileSafe(name)}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
