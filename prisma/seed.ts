import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, QuestionType } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} .env da berilmagan`);
  return value;
}

const GROUPS = ["Frontend-1", "Frontend-2"];
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

async function main() {
  const teacherPassword = requireEnv("SEED_TEACHER_PASSWORD");
  const studentPassword = requireEnv("SEED_STUDENT_PASSWORD");

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

  const studentHash = await hashPassword(studentPassword);
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
    `Seed tayyor: 1 o'qituvchi, ${GROUPS.length} guruh, ${GROUPS.length * STUDENTS_PER_GROUP} o'quvchi, 1 test (${CSS_QUESTIONS.length} savol)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
