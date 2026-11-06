import "server-only";
import { db } from "@/lib/db";
import { groupCode } from "@/lib/group-code";

/**
 * Guruh yaratish: seq bazadan (butun loyiha bo'yicha ketma-ket), kod shu seq bilan darhol
 * yoziladi va keyin o'zgarmaydi (nom yoki region o'zgarsa ham)
 */
export async function createGroupRecord(input: {
  name: string;
  regionId: string | null;
  teacherId: string;
}): Promise<{ id: string; code: string }> {
  return db.$transaction(async (tx) => {
    const group = await tx.group.create({
      data: input,
      select: {
        id: true,
        seq: true,
        region: { select: { name: true } },
        teacher: { select: { fullName: true } },
      },
    });
    const code = groupCode({
      regionName: group.region?.name ?? null,
      teacherFullName: group.teacher.fullName,
      seq: group.seq,
      groupName: input.name,
    });
    await tx.group.update({ where: { id: group.id }, data: { code } });
    return { id: group.id, code };
  });
}
