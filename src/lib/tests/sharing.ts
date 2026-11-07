import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// Test ulashish (ROLES.md, 2026-11-06 qarori; 2026-11-07 dan istalgan regionga): egasi
// testni regionga yoki tanlangan o'qituvchilarga (boshqa regionlardagilarga ham) ulashadi; oluvchi o'z NUSXASINI oladi (asl test va uning natijalari
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

/** Ulashishni to'liq almashtirish. Faqat egasi; istalgan region va boshqa o'qituvchilar */
export async function setTestShares(
  ownerId: string,
  testId: string,
  input: { regionIds: string[]; teacherIds: string[] },
): Promise<{ ok: true; count: number } | { ok: false }> {
  const test = await db.test.count({ where: { id: testId, ownerId } });
  if (test === 0) return { ok: false };
  const targets = await validTargets(ownerId, input);
  if (!targets) return { ok: false };
  const { regionIds, teacherIds } = targets;
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

/**
 * Bir nechta testni bir yo'la ulashish: mavjud ulashishlar saqlanadi, yangilari qo'shiladi.
 * Hamma testlar egasiniki bo'lishi shart (bittasi begona bo'lsa — hech narsa o'zgarmaydi)
 */
export async function addTestShares(
  ownerId: string,
  testIds: string[],
  input: { regionIds: string[]; teacherIds: string[] },
): Promise<{ ok: true; tests: number } | { ok: false }> {
  const ids = [...new Set(testIds)];
  const owned = await db.test.count({ where: { id: { in: ids }, ownerId } });
  if (ids.length === 0 || owned !== ids.length) return { ok: false };
  const targets = await validTargets(ownerId, input);
  if (!targets || targets.regionIds.length + targets.teacherIds.length === 0)
    return { ok: false };
  await db.testShare.createMany({
    data: ids.flatMap((testId) => [
      ...targets.regionIds.map((regionId) => ({ testId, regionId })),
      ...targets.teacherIds.map((teacherId) => ({ testId, teacherId })),
    ]),
    skipDuplicates: true,
  });
  return { ok: true, tests: ids.length };
}

/** Mavjud regionlar va boshqa faol o'qituvchilar (o'zidan tashqari); aks holda null */
async function validTargets(
  ownerId: string,
  input: { regionIds: string[]; teacherIds: string[] },
): Promise<{ regionIds: string[]; teacherIds: string[] } | null> {
  const regionIds = [...new Set(input.regionIds)];
  const teacherIds = [...new Set(input.teacherIds)].filter(
    (id) => id !== ownerId,
  );
  const [regions, teachers] = await Promise.all([
    db.region.count({ where: { id: { in: regionIds } } }),
    db.user.count({
      where: { id: { in: teacherIds }, role: "TEACHER", isActive: true },
    }),
  ]);
  if (regions !== regionIds.length || teachers !== teacherIds.length)
    return null;
  return { regionIds, teacherIds };
}

type Option = { id: string; name: string };

export type ShareTargets = {
  /** Hamma regionlar — o'zinikilari birinchi — va ulardagi boshqa faol o'qituvchilar */
  regions: (Option & { own: boolean; teachers: Option[] })[];
  /** Regionga biriktirilmagan faol o'qituvchilar */
  unassigned: Option[];
};

/** Ulashish uchun tanlov: regionlar, har birida o'qituvchilari */
export async function getShareTargets(ownerId: string): Promise<ShareTargets> {
  const activeTeacher = {
    role: "TEACHER",
    isActive: true,
    id: { not: ownerId },
  } satisfies Prisma.UserWhereInput;
  const [regions, unassigned] = await Promise.all([
    db.region.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        teachers: {
          where: { teacher: activeTeacher },
          orderBy: { teacher: { fullName: "asc" } },
          select: { teacherId: true, teacher: { select: { fullName: true } } },
        },
        _count: { select: { teachers: { where: { teacherId: ownerId } } } },
      },
    }),
    db.user.findMany({
      where: { ...activeTeacher, teacherRegions: { none: {} } },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
  ]);
  return {
    regions: regions
      .map((r) => ({
        id: r.id,
        name: r.name,
        own: r._count.teachers > 0,
        teachers: r.teachers.map((t) => ({
          id: t.teacherId,
          name: t.teacher.fullName,
        })),
      }))
      .sort((a, b) => Number(b.own) - Number(a.own)),
    unassigned: unassigned.map((t) => ({ id: t.id, name: t.fullName })),
  };
}

/** Ulashish dialogi uchun: tanlov va hozirgi ulashish */
export async function getShareOptions(ownerId: string, testId: string) {
  const [targets, current] = await Promise.all([
    getShareTargets(ownerId),
    db.testShare.findMany({
      where: { testId },
      select: { regionId: true, teacherId: true },
    }),
  ]);
  return {
    ...targets,
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
