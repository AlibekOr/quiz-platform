import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, QuestionType } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";
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

async function main() {
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
  for (const [gi, name] of GROUPS.entries()) {
    const group = await db.group.upsert({
      where: { name },
      update: {},
      create: { name },
    });
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
  // Qayta ishga tushirilganda dublikat bo'lmasligi uchun
  await db.test.deleteMany({ where: { title, createdById: teacher.id } });
  await db.test.create({
    data: {
      title,
      description: "Namunaviy test: selektorlar, layout, birliklar",
      durationMin: 15,
      isActive: true,
      createdById: teacher.id,
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

  console.log(
    `Seed tayyor: 1 o'qituvchi, ${GROUPS.length} guruh, ${GROUPS.length * STUDENTS_PER_GROUP} o'quvchi, 1 test (${CSS_QUESTIONS.length} savol), dars jadvali va 2 haftalik davomat`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
