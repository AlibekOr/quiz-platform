import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, QuestionType } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { groupCode } from "../src/lib/group-code";
import { addDays, toDbDate, todayInTashkent, weekdayOf } from "../src/lib/time";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} .env da berilmagan`);
  return value;
}

const GROUPS = ["Frontend-1", "Frontend-2"];

// Dars jadvali: Frontend-1 — Du/Cho/Ju 14:00–16:00, Frontend-2 — Se/Pa/Sha 10:00–12:00
const SCHEDULES: Record<
  string,
  { weekdays: number[]; startTime: string; endTime: string }
> = {
  "Frontend-1": { weekdays: [1, 3, 5], startTime: "14:00", endTime: "16:00" },
  "Frontend-2": { weekdays: [2, 4, 6], startTime: "10:00", endTime: "12:00" },
};
const STUDENTS_PER_GROUP = 5;

const PENALTY_TYPES = [
  { name: "Darsga sababsiz kelmaslik", defaultPoints: 2 },
  { name: "Uyga vazifani ko'chirish", defaultPoints: 2 },
  { name: "Darsda tartibni buzish", defaultPoints: 1 },
  { name: "Darsga kechikish", defaultPoints: 1 },
];

type SeedQuestion = {
  text: string;
  type: QuestionType;
  options: [text: string, isCorrect: boolean][];
};

const CSS_QUESTIONS: SeedQuestion[] = [
  {
    text: "Qaysi xususiyat matn rangini o'zgartiradi?",
    type: "SINGLE",
    options: [
      ["color", true],
      ["font-color", false],
      ["text-color", false],
      ["background", false],
    ],
  },
  {
    text: "Flexbox konteynerini qaysi qiymat yaratadi?",
    type: "SINGLE",
    options: [
      ["display: block", false],
      ["display: flex", true],
      ["position: flex", false],
      ["flex: 1", false],
    ],
  },
  {
    text: "Quyidagilardan qaysilari CSS uzunlik birliklari?",
    type: "MULTIPLE",
    options: [
      ["rem", true],
      ["vh", true],
      ["px", true],
      ["deg", false],
    ],
  },
  {
    text: "Eng yuqori specificity'ga ega selektor qaysi?",
    type: "SINGLE",
    options: [
      ["#header", true],
      [".header", false],
      ["header", false],
      ["*", false],
    ],
  },
  {
    text: "Qaysi `position` qiymatlari elementni oddiy oqimdan chiqaradi?",
    type: "MULTIPLE",
    options: [
      ["absolute", true],
      ["fixed", true],
      ["relative", false],
      ["static", false],
    ],
  },
  {
    text: "`box-sizing: border-box` nima qiladi?",
    type: "SINGLE",
    options: [
      ["width ichiga padding va border'ni ham kiritadi", true],
      ["margin'ni olib tashlaydi", false],
      ["border'ni yashiradi", false],
      ["elementni blok qiladi", false],
    ],
  },
  {
    text: "Grid'da ustunlarni qaysi xususiyat belgilaydi?",
    type: "SINGLE",
    options: [
      ["grid-template-columns", true],
      ["grid-columns", false],
      ["column-count", false],
      ["grid-auto-rows", false],
    ],
  },
  {
    text: "Qaysilari psevdo-klasslar?",
    type: "MULTIPLE",
    options: [
      [":hover", true],
      [":focus-visible", true],
      ["::before", false],
      ["::after", false],
    ],
  },
  {
    text: "Media query'da telefon uchun to'g'ri yozuv qaysi?",
    type: "SINGLE",
    options: [
      ["@media (max-width: 640px)", true],
      ["@screen phone", false],
      ["@media phone", false],
      ["@query (width < 640)", false],
    ],
  },
  {
    text: "Qaysi xususiyatlar animatsiya qilinganda GPU uchun arzon hisoblanadi?",
    type: "MULTIPLE",
    options: [
      ["transform", true],
      ["opacity", true],
      ["width", false],
      ["top", false],
    ],
  },
];

// Prod: `pnpm db:seed:prod` — faqat o'qituvchi akkaunti, namunaviy ma'lumotlarsiz
const TEACHER_ONLY = process.argv.includes("--teacher-only");
// Prod: `pnpm db:seed:admin` — faqat ADMIN akkaunti (SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD)
const ADMIN_ONLY = process.argv.includes("--admin-only");

/** Mavjud bo'lsa tegilmaydi (parol ham o'zgarmaydi) */
async function upsertUser(data: {
  username: string;
  fullName: string;
  password: string;
  role: "ADMIN" | "TEACHER" | "MANAGER";
  regionId?: string;
  createdById?: string;
}) {
  const { password, ...rest } = data;
  return db.user.upsert({
    where: { username: data.username },
    update: {},
    create: { ...rest, passwordHash: await hashPassword(password) },
  });
}

/** O'qituvchining shu nomli guruhi bo'lmasa yaratadi: seq bazadan, kod darhol (lib/groups-data.ts) */
async function ensureGroup(
  name: string,
  teacherId: string,
  regionId: string | null,
) {
  const existing = await db.group.findFirst({ where: { name, teacherId } });
  if (existing) return existing;
  const group = await db.group.create({
    data: { name, teacherId, regionId },
    include: { region: true, teacher: true },
  });
  return db.group.update({
    where: { id: group.id },
    data: {
      code: groupCode({
        regionName: group.region?.name ?? null,
        teacherFullName: group.teacher.fullName,
        seq: group.seq,
        groupName: name,
      }),
    },
  });
}

/** Har bir o'qituvchiga namunaviy jarima shablonlari (o'zgartirganiga tegilmaydi) */
async function ensurePenaltyTypes(ownerId: string) {
  for (const t of PENALTY_TYPES) {
    await db.penaltyType.upsert({
      where: { ownerId_name: { ownerId, name: t.name } },
      update: {},
      create: { ...t, ownerId },
    });
  }
}

async function seedAdmin() {
  const password = requireEnv("SEED_ADMIN_PASSWORD");
  if (password.length < 8)
    throw new Error("SEED_ADMIN_PASSWORD kamida 8 belgi bo'lsin");
  const admin = await upsertUser({
    username: requireEnv("SEED_ADMIN_USERNAME"),
    fullName: process.env.SEED_ADMIN_FULLNAME || "Administrator",
    password,
    role: "ADMIN",
  });
  if (admin.role !== "ADMIN")
    throw new Error(
      `"${admin.username}" allaqachon ${admin.role} sifatida bor`,
    );
  console.log(`Seed tayyor: admin "${admin.username}"`);
}

async function main() {
  if (ADMIN_ONLY) return seedAdmin();

  const teacherPassword = requireEnv("SEED_TEACHER_PASSWORD");
  if (TEACHER_ONLY && teacherPassword.length < 8)
    throw new Error("Prod uchun SEED_TEACHER_PASSWORD kamida 8 belgi bo'lsin");

  const teacher = await db.user.upsert({
    where: { username: requireEnv("SEED_TEACHER_USERNAME") },
    update: {},
    create: {
      username: requireEnv("SEED_TEACHER_USERNAME"),
      fullName: process.env.SEED_TEACHER_FULLNAME || "O'qituvchi",
      passwordHash: await hashPassword(teacherPassword),
      role: "TEACHER",
    },
  });

  if (TEACHER_ONLY) {
    console.log(`Seed tayyor: o'qituvchi "${teacher.username}"`);
    return;
  }

  const studentHash = await hashPassword(requireEnv("SEED_STUDENT_PASSWORD"));
  const groups = [];
  // Regionlar guruhlardan oldin: kodda region harfi bo'lsin (Frontend-1 → TO-1-F)
  const GROUP_REGION: Record<string, string> = {
    "Frontend-1": "Toshkent",
    "Frontend-2": "Samarqand",
  };
  for (const [gi, name] of GROUPS.entries()) {
    const region = await db.region.upsert({
      where: { name: GROUP_REGION[name] },
      update: {},
      create: { name: GROUP_REGION[name] },
    });
    const group = await ensureGroup(name, teacher.id, region.id);
    groups.push(group);

    for (let i = 1; i <= STUDENTS_PER_GROUP; i++) {
      const username = `student${gi + 1}${i}`;
      const student = await db.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          fullName: `O'quvchi ${gi + 1}-${i}`,
          passwordHash: studentHash,
          groupId: group.id,
        },
      });
      // Namunaviy (soxta) aloqa ma'lumotlari — mavjud profilga tegilmaydi
      const n = `${gi + 1}${i}`;
      await db.studentProfile.upsert({
        where: { userId: student.id },
        update: {},
        create: {
          userId: student.id,
          phone: `+9989000000${n}`,
          telegram: `@oquvchi_${n}`,
          parentName: `Ota-ona ${gi + 1}-${i}`,
          parentRelation: i % 2 === 0 ? "MOTHER" : "FATHER",
          parentPhone: `+9989100000${n}`,
        },
      });
    }
  }

  // Jadval va o'tgan 2 haftaga namunaviy davomat (o'qituvchi tahrirlagan yozuvlarga tegilmaydi)
  const today = todayInTashkent();
  for (const group of groups) {
    const plan = SCHEDULES[group.name];
    for (const weekday of plan.weekdays) {
      await db.groupSchedule.upsert({
        where: { groupId_weekday: { groupId: group.id, weekday } },
        update: {},
        create: {
          groupId: group.id,
          weekday,
          startTime: plan.startTime,
          endTime: plan.endTime,
        },
      });
    }
    const students = await db.user.findMany({
      where: { groupId: group.id, role: "STUDENT" },
      orderBy: { username: "asc" },
      select: { id: true },
    });
    for (let back = 14; back >= 1; back--) {
      const date = addDays(today, -back);
      if (!plan.weekdays.includes(weekdayOf(date))) continue;
      const lesson = await db.lesson.upsert({
        where: { groupId_date: { groupId: group.id, date: toDbDate(date) } },
        update: {},
        create: {
          groupId: group.id,
          date: toDbDate(date),
          topic: `Mavzu ${date}`,
        },
      });
      for (const [si, student] of students.entries()) {
        // Deterministik naqsh: ba'zilar kelmagan yoki kechikkan
        const k = (si * 7 + back * 3) % 10;
        const status = k === 0 ? "ABSENT" : k === 1 ? "LATE" : "PRESENT";
        await db.attendance.upsert({
          where: {
            lessonId_studentId: { lessonId: lesson.id, studentId: student.id },
          },
          update: {},
          create: {
            lessonId: lesson.id,
            studentId: student.id,
            status,
            note:
              status === "ABSENT" && si === 0
                ? "Kasal (ota-onasi qo'ng'iroq qildi)"
                : null,
          },
        });
      }
    }
  }

  const title = "CSS asoslari";
  // Test bor bo'lsa tegilmaydi: qayta yaratish uning urinishlari va natijalarini o'chirib yuboradi
  const existingTest = await db.test.findFirst({
    where: { title, createdById: teacher.id },
    select: { id: true },
  });
  if (!existingTest)
    await db.test.create({
      data: {
        title,
        description: "Namunaviy test: selektorlar, layout, birliklar",
        durationMin: 15,
        isActive: true,
        createdById: teacher.id,
        ownerId: teacher.id,
        groups: { connect: groups.map((g) => ({ id: g.id })) },
        questions: {
          create: CSS_QUESTIONS.map((q, qi) => ({
            text: q.text,
            type: q.type,
            order: qi,
            options: {
              create: q.options.map(([text, isCorrect], oi) => ({
                text,
                isCorrect,
                order: oi,
              })),
            },
          })),
        },
      },
    });

  // Regionlar va menejerlar (faqat dev): har regionda bitta guruh, ikkinchi menejerga
  // birinchi regiondagi guruh qo'shimcha biriktiriladi. Parol — o'quvchilarniki bilan bir xil
  const managerSetup = [
    {
      region: "Toshkent",
      group: "Frontend-1",
      username: "manager1",
      extra: null,
    },
    {
      region: "Samarqand",
      group: "Frontend-2",
      username: "manager2",
      extra: "Frontend-1",
    },
  ];
  for (const [i, m] of managerSetup.entries()) {
    const region = await db.region.upsert({
      where: { name: m.region },
      update: {},
      create: { name: m.region },
    });
    // O'qituvchi o'zgartirgan regionga tegilmaydi
    await db.group.updateMany({
      where: { name: m.group, regionId: null },
      data: { regionId: region.id },
    });
    const manager = await db.user.upsert({
      where: { username: m.username },
      update: {},
      create: {
        username: m.username,
        fullName: `Menejer ${i + 1}`,
        passwordHash: studentHash,
        role: "MANAGER",
        regionId: region.id,
        createdById: teacher.id,
      },
    });
    await db.teacherRegion.upsert({
      where: {
        teacherId_regionId: { teacherId: teacher.id, regionId: region.id },
      },
      update: {},
      create: { teacherId: teacher.id, regionId: region.id },
    });
    await db.teacherManager.upsert({
      where: {
        teacherId_managerId: { teacherId: teacher.id, managerId: manager.id },
      },
      update: {},
      create: { teacherId: teacher.id, managerId: manager.id },
    });
    // Doira: o'z regionidagi guruh + qo'shimcha (boshqa regiondan)
    for (const name of [m.group, m.extra]) {
      const group = groups.find((g) => g.name === name);
      if (!group) continue;
      await db.managerGroup.upsert({
        where: {
          managerId_groupId: { managerId: manager.id, groupId: group.id },
        },
        update: {},
        create: {
          managerId: manager.id,
          groupId: group.id,
          assignedById: teacher.id,
        },
      });
    }
  }
  await ensurePenaltyTypes(teacher.id);

  // Ko'p o'qituvchi (ROLES.md): admin, yana 2 o'qituvchi. teacher2 — Toshkentda (teacher bilan
  // bitta regionda, guruh nomi ham bir xil — kod farqlaydi), teacher3 — Samarqandda.
  // manager1 ikki o'qituvchi bilan ishlaydi. Parol — o'quvchilarniki bilan bir xil
  const admin = await upsertUser({
    username: "admin",
    fullName: "Administrator",
    password: requireEnv("SEED_STUDENT_PASSWORD"),
    role: "ADMIN",
  });
  const manager1 = await db.user.findUniqueOrThrow({
    where: { username: "manager1" },
  });
  const extraTeachers = [
    {
      username: "teacher2",
      fullName: "Karimov Bobur",
      region: "Toshkent",
      group: "Frontend-1",
      manager: manager1,
    },
    {
      username: "teacher3",
      fullName: "Saidova Malika",
      region: "Samarqand",
      group: "Backend-1",
      manager: null,
    },
  ];
  for (const [ti, t] of extraTeachers.entries()) {
    const region = await db.region.findUniqueOrThrow({
      where: { name: t.region },
    });
    const user = await upsertUser({
      username: t.username,
      fullName: t.fullName,
      password: requireEnv("SEED_STUDENT_PASSWORD"),
      role: "TEACHER",
      createdById: admin.id,
    });
    await db.teacherRegion.upsert({
      where: {
        teacherId_regionId: { teacherId: user.id, regionId: region.id },
      },
      update: {},
      create: { teacherId: user.id, regionId: region.id },
    });
    const group = await ensureGroup(t.group, user.id, region.id);
    for (let i = 1; i <= 3; i++) {
      const username = `student${ti + 3}${i}`;
      await db.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          fullName: `O'quvchi ${ti + 3}-${i}`,
          passwordHash: studentHash,
          groupId: group.id,
        },
      });
    }
    if (t.manager) {
      await db.teacherManager.upsert({
        where: {
          teacherId_managerId: { teacherId: user.id, managerId: t.manager.id },
        },
        update: {},
        create: { teacherId: user.id, managerId: t.manager.id },
      });
      await db.managerGroup.upsert({
        where: {
          managerId_groupId: { managerId: t.manager.id, groupId: group.id },
        },
        update: {},
        create: {
          managerId: t.manager.id,
          groupId: group.id,
          assignedById: user.id,
        },
      });
    }
    await ensurePenaltyTypes(user.id);
  }

  console.log(
    `Seed tayyor: admin, ${1 + extraTeachers.length} o'qituvchi, ${GROUPS.length + extraTeachers.length} guruh, ${GROUPS.length * STUDENTS_PER_GROUP} o'quvchi, 1 test (${CSS_QUESTIONS.length} savol), dars jadvali, 2 haftalik davomat, ${managerSetup.length} region va ${managerSetup.length} menejer, ${PENALTY_TYPES.length} jarima shabloni`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
