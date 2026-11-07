import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// Test ulashish (ROLES.md, 2026-11-06 qarori; 2026-11-08 aniqlik): egasi testni o'z
// regioniga butunlay yoki tanlangan o'qituvchilarga (istalgan regiondan) ulashadi; oluvchi
// o'z NUSXASINI oladi (asl test va uning natijalari o'zgarmaydi). Menejer yaratgan testdan
// u ishlaydigan o'qituvchilar nusxa oladi. Boshqa o'qituvchining ulashilmagan testini olib bo'lmaydi

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

/** Ulashishni to'liq almashtirish. Faqat egasi; maqsadlar — validTargets */
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

/**
 * Butun region — faqat o'z regionlari; o'qituvchilar — istalgan regiondagi boshqa faol
 * o'qituvchilar. Aks holda null
 */
async function validTargets(
  ownerId: string,
  input: { regionIds: string[]; teacherIds: string[] },
): Promise<{ regionIds: string[]; teacherIds: string[] } | null> {
  const regionIds = [...new Set(input.regionIds)];
  const teacherIds = [...new Set(input.teacherIds)].filter(
    (id) => id !== ownerId,
  );
  const [ownRegions, teachers] = await Promise.all([
    db.teacherRegion.count({
      where: { teacherId: ownerId, regionId: { in: regionIds } },
    }),
    db.user.count({
      where: { ...shareableTeacher(ownerId), id: { in: teacherIds } },
    }),
  ]);
  if (ownRegions !== regionIds.length || teachers !== teacherIds.length)
    return null;
  return { regionIds, teacherIds };
}

/** Ulashsa bo'ladigan o'qituvchi: faol, egasining o'zi emas */
function shareableTeacher(ownerId: string) {
  return {
    role: "TEACHER",
    isActive: true,
    id: { not: ownerId },
  } satisfies Prisma.UserWhereInput;
}

type Option = { id: string; name: string };

export type ShareTargets = {
  /** Hamma regionlar (o'zinikilari birinchi); o'qituvchilar ochilganda yuklanadi */
  regions: (Option & { own: boolean; teacherCount: number })[];
  /** Regionga biriktirilmagan faol o'qituvchilar soni */
  unassignedCount: number;
};

/** Ulashish uchun tanlov: regionlar va ulardagi o'qituvchilar soni (ro'yxatsiz) */
export async function getShareTargets(ownerId: string): Promise<ShareTargets> {
  const teacher = shareableTeacher(ownerId);
  const [regions, own, unassignedCount] = await Promise.all([
    db.region.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { teachers: { where: { teacher } } } },
      },
    }),
    db.teacherRegion.findMany({
      where: { teacherId: ownerId },
      select: { regionId: true },
    }),
    db.user.count({ where: { ...teacher, teacherRegions: { none: {} } } }),
  ]);
  const ownIds = new Set(own.map((r) => r.regionId));
  return {
    regions: regions
      .map((r) => ({
        id: r.id,
        name: r.name,
        own: ownIds.has(r.id),
        teacherCount: r._count.teachers,
      }))
      .sort((a, b) => Number(b.own) - Number(a.own)),
    unassignedCount,
  };
}

/** Bitta regiondagi (null — regionsiz) boshqa faol o'qituvchilar */
export async function getRegionShareTeachers(
  ownerId: string,
  regionId: string | null,
): Promise<Option[]> {
  const teachers = await db.user.findMany({
    where: {
      ...shareableTeacher(ownerId),
      teacherRegions: regionId ? { some: { regionId } } : { none: {} },
    },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
  });
  return teachers.map((t) => ({ id: t.id, name: t.fullName }));
}

const SHARE_SEARCH_LIMIT = 30;

export type ShareSearchResult = {
  teachers: (Option & { regions: string })[];
  /** Limitdan ko'p topildi — aniqroq yozish kerak */
  more: boolean;
};

/** Ism bo'yicha qidiruv (hamma regionlardan), regionlari bilan */
export async function searchShareTeachers(
  ownerId: string,
  query: string,
): Promise<ShareSearchResult> {
  const found = await db.user.findMany({
    where: {
      ...shareableTeacher(ownerId),
      fullName: { contains: query, mode: "insensitive" },
    },
    orderBy: { fullName: "asc" },
    take: SHARE_SEARCH_LIMIT + 1,
    select: {
      id: true,
      fullName: true,
      teacherRegions: {
        orderBy: { region: { name: "asc" } },
        select: { region: { select: { name: true } } },
      },
    },
  });
  return {
    teachers: found.slice(0, SHARE_SEARCH_LIMIT).map((t) => ({
      id: t.id,
      name: t.fullName,
      regions: t.teacherRegions.map((r) => r.region.name).join(", "),
    })),
    more: found.length > SHARE_SEARCH_LIMIT,
  };
}

/** Ulashish dialogi uchun: tanlov va hozirgi ulashish (tanlangan o'qituvchilar ismi bilan) */
export async function getShareOptions(ownerId: string, testId: string) {
  const [targets, current] = await Promise.all([
    getShareTargets(ownerId),
    db.testShare.findMany({
      where: { testId },
      select: {
        regionId: true,
        teacher: { select: { id: true, fullName: true } },
      },
    }),
  ]);
  return {
    ...targets,
    regionIds: current.flatMap((s) => (s.regionId ? [s.regionId] : [])),
    teachers: current.flatMap((s) =>
      s.teacher ? [{ id: s.teacher.id, name: s.teacher.fullName }] : [],
    ),
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
