import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import {
  canAccessGroup,
  getScope,
  studentScopeWhere,
} from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { fileSafe } from "@/lib/format";
import { buildStudentsWorkbook } from "@/lib/students/export";
import { teacherProfileSelect } from "@/lib/students/profile-select";
import { studentExportQuerySchema } from "@/lib/validators/student";

const XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// GET /api/students/export?groupId= — o'qituvchi yoki menejer (faqat o'z doirasi).
// groupId berilmasa doiradagi barcha o'quvchilar; doiradan tashqaridagi groupId — 403
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json({ error: "Avtorizatsiya kerak" }, { status: 401 });
  if (user.role !== "TEACHER" && user.role !== "MANAGER")
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  const scope = await getScope(user);

  const query = studentExportQuerySchema.safeParse({
    groupId: request.nextUrl.searchParams.get("groupId"),
  });
  if (!query.success)
    return Response.json({ error: "groupId noto'g'ri" }, { status: 400 });
  const { groupId } = query.data;
  const group = groupId
    ? await db.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      })
    : null;
  if (groupId && !group)
    return Response.json({ error: "Guruh topilmadi" }, { status: 404 });
  if (groupId && !canAccessGroup(scope, groupId))
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  const students = await db.user.findMany({
    where: {
      role: "STUDENT",
      archivedAt: null,
      ...(groupId ? { groupId } : {}),
      ...studentScopeWhere(scope),
    },
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
