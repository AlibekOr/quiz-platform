import "server-only";
import { computeStats } from "@/lib/attendance";
import type { CurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getStudentSemesters } from "@/lib/grades-data";
import { todayInTashkent } from "@/lib/time";

// /profile ma'lumotlari: har kim faqat o'zinikini ko'radi (id sessiyadan, URL'dan emas)

/**
 * O'quvchi o'z profilida ko'radigan aloqa maydonlari. O'qituvchi izohi (note) kirmaydi.
 * Bu CLAUDE.md 10-qoidasidan yagona istisno: o'quvchi faqat O'ZINING ma'lumotini ko'radi
 */
const ownProfileSelect = {
  phone: true,
  telegram: true,
  parentName: true,
  parentRelation: true,
  parentPhone: true,
} as const;

async function studentDetails(studentId: string) {
  // Joriy semestr: bugunni o'z ichiga olgani, bo'lmasa eng yangisi
  const today = todayInTashkent();
  const semesters = await getStudentSemesters(studentId);
  const semester =
    semesters.find(
      (s) => s.semester.startDate <= today && today <= s.semester.endDate,
    ) ??
    semesters[0] ??
    null;
  const student = await db.user.findUniqueOrThrow({
    where: { id: studentId },
    select: {
      group: { select: { name: true } },
      profile: { select: ownProfileSelect },
      attendances: { select: { status: true } },
    },
  });
  return {
    group: student.group?.name ?? null,
    contacts: student.profile,
    semester,
    attendance: computeStats(student.attendances.map((a) => a.status)),
  };
}

async function managerDetails(managerId: string, regionId: string | null) {
  const [region, extra] = await Promise.all([
    regionId
      ? db.region.findUnique({
          where: { id: regionId },
          select: {
            name: true,
            groups: { orderBy: { name: "asc" }, select: { name: true } },
          },
        })
      : null,
    db.managerGroup.findMany({
      where: { managerId },
      orderBy: { group: { name: "asc" } },
      select: { group: { select: { name: true } } },
    }),
  ]);
  return {
    region: region
      ? { name: region.name, groups: region.groups.map((g) => g.name) }
      : null,
    extraGroups: extra.map((m) => m.group.name),
  };
}

export async function getProfile(user: CurrentUser) {
  const base = {
    fullName: user.fullName,
    username: user.username,
    role: user.role,
  };
  if (user.role === "STUDENT")
    return {
      ...base,
      kind: "student" as const,
      ...(await studentDetails(user.id)),
    };
  if (user.role === "MANAGER")
    return {
      ...base,
      kind: "manager" as const,
      ...(await managerDetails(user.id, user.regionId)),
    };
  return { ...base, kind: "teacher" as const };
}

export type Profile = Awaited<ReturnType<typeof getProfile>>;
