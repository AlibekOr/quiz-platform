import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// Test ulashish (ROLES.md, 2026-11-06 qarori): egasi testni regionga yoki tanlangan
// o'qituvchilarga ulashadi; oluvchi o'z NUSXASINI oladi (asl test va uning natijalari
// o'zgarmaydi). Menejer yaratgan testdan u ishlaydigan o'qituvchilar nusxa oladi.
// Boshqa o'qituvchining ulashilmagan testini olib bo'lmaydi

/** O'qituvchiga ulashilgan (yoki u ishlaydigan menejer yaratgan) testlar — o'zinikisiz */
export function sharedWithWhere(teacherId: string): Prisma.TestWhereInput {
  return {
    // NOT { ownerId } null'ni ham chiqarib yuboradi (SQL) — egasiz menejer testlari qolsin
    AND: [{ OR: [{ ownerId: null }, { ownerId: { not: teacherId } }] }],
    OR: [
      { shares: { some: { teacherId } } },
      { shares: { some: { region: { teachers: { some: { teacherId } } } } } },
      {
        ownerId: null,
        createdBy: { role: "MANAGER", teachers: { some: { teacherId } } },
      },
    ],
  };
}

export type SharedTest = {
  id: string;
  title: string;
  questionCount: number;
  author: string;
};

export async function getSharedTests(teacherId: string): Promise<SharedTest[]> {
  const tests = await db.test.findMany({
    where: sharedWithWhere(teacherId),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdBy: { select: { fullName: true } },
      owner: { select: { fullName: true } },
      _count: { select: { questions: true } },
    },
  });
  return tests.map((t) => ({
    id: t.id,
    title: t.title,
    questionCount: t._count.questions,
    author: t.owner?.fullName ?? t.createdBy.fullName,
  }));
}

/**
 * Ulashishni to'liq almashtirish. Faqat egasi; regionlar — o'z regionlari, o'qituvchilar —
 * o'z regionlaridan biridagi o'qituvchilar
 */
export async function setTestShares(
  ownerId: string,
  testId: string,
  input: { regionIds: string[]; teacherIds: string[] },
): Promise<{ ok: true; count: number } | { ok: false }> {
  const test = await db.test.count({ where: { id: testId, ownerId } });
  if (test === 0) return { ok: false };
  const regionIds = [...new Set(input.regionIds)];
  const teacherIds = [...new Set(input.teacherIds)].filter(
    (id) => id !== ownerId,
  );
  const [ownRegions, teachers] = await Promise.all([
    db.teacherRegion.count({
      where: { teacherId: ownerId, regionId: { in: regionIds } },
    }),
    db.user.count({
      where: {
        id: { in: teacherIds },
        role: "TEACHER",
        teacherRegions: {
          some: { region: { teachers: { some: { teacherId: ownerId } } } },
        },
      },
    }),
  ]);
  if (ownRegions !== regionIds.length || teachers !== teacherIds.length)
    return { ok: false };
  await db.$transaction([
    db.testShare.deleteMany({ where: { testId } }),
    db.testShare.createMany({
      data: [
        ...regionIds.map((regionId) => ({ testId, regionId })),
        ...teacherIds.map((teacherId) => ({ testId, teacherId })),
      ],
    }),
  ]);
  return { ok: true, count: regionIds.length + teacherIds.length };
}

/** Ulashish dialogi uchun: o'z regionlari, ulardagi boshqa o'qituvchilar, hozirgi ulashish */
export async function getShareOptions(ownerId: string, testId: string) {
  const [regions, teachers, current] = await Promise.all([
    db.region.findMany({
      where: { teachers: { some: { teacherId: ownerId } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.user.findMany({
      where: {
        role: "TEACHER",
        isActive: true,
        id: { not: ownerId },
        teacherRegions: {
          some: { region: { teachers: { some: { teacherId: ownerId } } } },
        },
      },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    db.testShare.findMany({
      where: { testId },
      select: { regionId: true, teacherId: true },
    }),
  ]);
  return {
    regions,
    teachers: teachers.map((t) => ({ id: t.id, name: t.fullName })),
    regionIds: current.flatMap((s) => (s.regionId ? [s.regionId] : [])),
    teacherIds: current.flatMap((s) => (s.teacherId ? [s.teacherId] : [])),
  };
}

/**
 * Ulashilgan testdan nusxa: yangi test (nofaol, guruhsiz) — savollar va variantlar bilan,
 * egasi — oluvchi. null — test ulashilmagan (yoki yo'q)
 */
export async function copySharedTest(
  teacherId: string,
  testId: string,
): Promise<string | null> {
  const source = await db.test.findFirst({
    where: { id: testId, ...sharedWithWhere(teacherId) },
    select: {
      id: true,
      title: true,
      description: true,
      durationMin: true,
      allowRetake: true,
      showAnswers: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          text: true,
          type: true,
          points: true,
          order: true,
          options: {
            orderBy: { order: "asc" },
            select: { text: true, isCorrect: true, order: true },
          },
        },
      },
    },
  });
  if (!source) return null;
  const { id, questions, ...settings } = source;
  const copy = await db.test.create({
    data: {
      ...settings,
      isActive: false,
      createdById: teacherId,
      ownerId: teacherId,
      copiedFromId: id,
      questions: {
        create: questions.map(({ options, ...q }) => ({
          ...q,
          options: { create: options },
        })),
      },
    },
    select: { id: true },
  });
  return copy.id;
}
