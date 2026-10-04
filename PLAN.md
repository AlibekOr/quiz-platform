# Test platformasi: ish rejasi

## Rollar va asosiy imkoniyatlar

**O'qituvchi (TEACHER)**
- Guruhlar yaratadi
- O'quvchi akkauntlarini ochadi: bittalab yoki Excel'dan import qiladi. Parolni tiklaydi, akkauntni bloklaydi
- Test yaratadi: savollar, variantlar, vaqt, sozlamalar. Testni guruhlarga biriktiradi va faollashtiradi
- Savollarni JSON/Excel'dan import qiladi
- Natijalar va statistikani ko'radi. Reytingni istalgan guruh bo'yicha ko'radi

**O'quvchi (STUDENT)**
- Faqat o'qituvchi bergan username + parol bilan kiradi (o'zi ro'yxatdan o'ta olmaydi)
- O'z guruhiga biriktirilgan faol testlarni ko'radi va ishlaydi
- Natijasini ko'radi (to'g'ri javoblar faqat `showAnswers = true` bo'lsa)
- Reytingni ko'radi: "Mening guruhim" va "Umumiy" tablari

---

## Prisma sxema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  TEACHER
  STUDENT
}

enum QuestionType {
  SINGLE
  MULTIPLE
}

enum AttemptStatus {
  IN_PROGRESS
  FINISHED
  EXPIRED
}

model User {
  id           String    @id @default(cuid())
  username     String    @unique
  fullName     String
  passwordHash String
  role         Role      @default(STUDENT)
  isActive     Boolean   @default(true)
  groupId      String?
  group        Group?    @relation(fields: [groupId], references: [id])
  attempts     Attempt[]
  createdTests Test[]    @relation("TestAuthor")
  createdAt    DateTime  @default(now())
}

model Group {
  id        String   @id @default(cuid())
  name      String   @unique
  students  User[]
  tests     Test[]
  createdAt DateTime @default(now())
}

model Test {
  id               String     @id @default(cuid())
  title            String
  description      String?
  durationMin      Int
  isActive         Boolean    @default(false)
  allowRetake      Boolean    @default(false)
  showAnswers      Boolean    @default(false)
  shuffleQuestions Boolean    @default(false)
  createdById      String
  createdBy        User       @relation("TestAuthor", fields: [createdById], references: [id])
  groups           Group[]
  questions        Question[]
  attempts         Attempt[]
  createdAt        DateTime   @default(now())
}

model Question {
  id      String       @id @default(cuid())
  testId  String
  test    Test         @relation(fields: [testId], references: [id], onDelete: Cascade)
  text    String
  type    QuestionType @default(SINGLE)
  points  Int          @default(1)
  order   Int
  options Option[]
  answers Answer[]
}

model Option {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text       String
  isCorrect  Boolean  @default(false)
  order      Int
}

model Attempt {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id])
  testId      String
  test        Test          @relation(fields: [testId], references: [id], onDelete: Cascade)
  status      AttemptStatus @default(IN_PROGRESS)
  isFirst     Boolean
  startedAt   DateTime      @default(now())
  deadlineAt  DateTime
  finishedAt  DateTime?
  durationSec Int?
  score       Int?
  maxScore    Int?
  answers     Answer[]

  @@index([testId, isFirst, status])
  @@index([userId, testId])
}

model Answer {
  id                String   @id @default(cuid())
  attemptId         String
  attempt           Attempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId        String
  question          Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  selectedOptionIds String[]
  isCorrect         Boolean?
  updatedAt         DateTime @updatedAt

  @@unique([attemptId, questionId])
}
```

---

## Biznes qoidalar

**Baholash (`lib/grading.ts`)**
- SINGLE: tanlangan variant to'g'ri bo'lsa, `points` beriladi.
- MULTIPLE: tanlanganlar to'plami to'g'ri variantlar to'plamiga **aynan teng** bo'lsagina `points` beriladi, aks holda 0 (qisman ball yo'q).
- `maxScore` = barcha savollar `points` yig'indisi.

**Attempt hayot sikli**
- Boshlash: test faol bo'lishi va o'quvchining guruhiga biriktirilgan bo'lishi kerak. `deadlineAt = now + durationMin`.
- O'quvchida shu testda `IN_PROGRESS` attempt bo'lsa, yangisi ochilmaydi, o'sha davom ettiriladi (sahifa yangilansa ham).
- `allowRetake = false` bo'lsa, `FINISHED/EXPIRED` attempt bor ekan, qayta boshlab bo'lmaydi.
- `isFirst` = shu user+test uchun birinchi attempt. Tranzaksiya ichida tekshiriladi.
- Javoblar har bir savolda **avtomatik saqlanadi** (upsert). Deadline + 5s dan keyin qabul qilinmaydi.
- Topshirish: baholash, `score`, `maxScore`, `finishedAt`, `durationSec`, `status = FINISHED`.
- Taymer 0 bo'lsa, klient avtomatik topshiradi.
- Muddati o'tgan, lekin topshirilmagan attemptlar: `finalizeExpiredAttempts(testId)` funksiyasi saqlangan javoblar bo'yicha baholab, `status = EXPIRED` qiladi (`durationSec = durationMin*60`). Bu funksiya reyting va natijalar o'qilishidan oldin chaqiriladi.

**Reyting (`lib/leaderboard.ts`)**
- Faqat `isFirst = true` va `status IN (FINISHED, EXPIRED)` attemptlar hisoblanadi.
- Tartib: `score DESC`, keyin `durationSec ASC`. O'rin `RANK()` bilan hisoblanadi (teng natijalar bir xil o'rin oladi).
- **Test reytingi:** bitta test bo'yicha.
- **Umumiy reyting:** har o'quvchi uchun barcha testlardagi birinchi urinish ballari yig'indisi, teng bo'lsa umumiy vaqt kamrog'i yuqorida.
- `scope`: `group` | `all`. O'quvchi uchun `group` bo'lganda guruh **sessiyadan** olinadi. O'qituvchi `groupId` parametrini berishi mumkin.
- Top 50 qaytariladi + joriy o'quvchining o'z qatori (top 50 da bo'lmasa ham) alohida `me` maydonida.
- Bloklangan (`isActive = false`) o'quvchilar reytingda ko'rinmaydi.

**Auth**
- Login: username + parol. Xato bo'lsa umumiy xabar: "Login yoki parol noto'g'ri".
- Session: JWT (`jose`, HS256), payload: `userId`, `role`, `groupId`. httpOnly, secure, sameSite=lax cookie, muddati 7 kun.
- Login urinishlariga oddiy cheklov: bir username uchun 15 daqiqada 10 ta xato bo'lsa, vaqtincha bloklanadi.
- `isActive = false` bo'lsa, kira olmaydi.
- Ro'yxatdan o'tish sahifasi YO'Q. Akkauntlarni faqat o'qituvchi yaratadi.

---

## Sahifalar

| Yo'l | Kim | Vazifasi |
|---|---|---|
| `/login` | hamma | Kirish |
| `/dashboard` | student | Mavjud testlar, o'z natijalari |
| `/test/[id]` | student | Test ishlash (taymer, savollar navigatsiyasi, avtosaqlash) |
| `/result/[attemptId]` | student (faqat o'zinikini) | Ball, o'rin, (ruxsat bo'lsa) to'g'ri javoblar |
| `/leaderboard` | student, teacher | Umumiy reyting: tablar "Mening guruhim" / "Umumiy" |
| `/test/[id]/leaderboard` | student, teacher | Test reytingi, xuddi shu tablar |
| `/teacher` | teacher | Umumiy ko'rinish (testlar, o'quvchilar soni, oxirgi natijalar) |
| `/teacher/groups` | teacher | Guruhlar CRUD |
| `/teacher/students` | teacher | O'quvchilar ro'yxati, qo'shish, Excel import, parol tiklash, bloklash |
| `/teacher/tests` | teacher | Testlar ro'yxati, yaratish |
| `/teacher/tests/[id]` | teacher | Tahrirlash: savollar, sozlamalar, guruhlar, import |
| `/teacher/tests/[id]/results` | teacher | Natijalar jadvali, savollar bo'yicha statistika |

API: `GET /api/leaderboard?testId=&scope=group|all&groupId=` (`testId` bo'lmasa umumiy reyting). Qolgan o'zgartirishlar Server Actions orqali bo'ladi.

---

## Bosqichlar

Har bosqichdan keyin to'xta va hisobot ber. `lint`, `typecheck`, `test` o'tishi shart.

### 1-bosqich: loyiha asosi
- Next.js + TS + Tailwind + shadcn/ui + ESLint + Prettier + Vitest sozlash, `package.json` skriptlari
- Prisma sxema (yuqoridagi), birinchi migratsiya, `lib/db.ts`
- `.env.example`
- `prisma/seed.ts`: env'dan o'qituvchi akkaunti, 2 ta guruh, har birida 5 ta o'quvchi, 1 ta namunaviy CSS test (10 savol, SINGLE va MULTIPLE aralash)

**Tayyor:** `pnpm db:migrate && pnpm db:seed` ishlaydi, Prisma Studio'da ma'lumotlar ko'rinadi.

### 2-bosqich: autentifikatsiya
- `lib/auth/password.ts` (hash/verify), `lib/auth/session.ts` (JWT yaratish/o'qish, cookie)
- `lib/auth/guards.ts`: `getSession()`, `requireTeacher()`, `requireStudent()`
- `proxy.ts`: login qilmaganlarni `/login`ga, studentni `/teacher/*` dan `/dashboard`ga yo'naltiradi
- `/login` sahifasi, logout tugmasi, login urinishlarini cheklash
- Vitest: parol hash, JWT yaratish/o'qish

**Tayyor:** teacher va student kirib o'z sahifasiga tushadi, bir-birining sahifasiga kira olmaydi, bloklangan user kira olmaydi.

### 3-bosqich: o'qituvchi, guruhlar va o'quvchilar
- Teacher layout (sidebar, telefonda hamburger menyu)
- `/teacher/groups`: CRUD
- `/teacher/students`: jadval (qidiruv, guruh filtri), qo'shish, tahrirlash, guruhni o'zgartirish, parolni tiklash, bloklash
- Excel import: ustunlar `fullName | username | password | group`. Importdan oldin preview, xatolarni qator bo'yicha ko'rsatish, takror username'larni rad etish

**Tayyor:** 30 ta o'quvchini Excel'dan bir yo'la qo'shsa bo'ladi, ular login qila oladi.

### 4-bosqich: testlar va savollar
- `/teacher/tests`: ro'yxat, yaratish
- `/teacher/tests/[id]`: sozlamalar (vaqt, allowRetake, showAnswers, shuffleQuestions, isActive), guruhlarga biriktirish
- Savol muharriri: qo'shish, tahrirlash, o'chirish, tartibini o'zgartirish, variantlar (kamida 2 ta, kamida 1 ta to'g'ri; SINGLE da aynan 1 ta)
- Savollarni import qilish: JSON (`[{ text, type, points, options: [{ text, isCorrect }] }]`) va Excel (`text | type | points | A | B | C | D | correct`, correct masalan `B` yoki `A,C`). Preview + validatsiya
- Javoblari bor testni o'chirishda ogohlantirish

**Tayyor:** mavjud savollar bazasini import qilib, test yaratib, guruhga faollashtirsa bo'ladi.

### 5-bosqich: test ishlash
- `/dashboard`: o'quvchi guruhidagi faol testlar, holati ("Boshlanmagan", "Davom etmoqda", "Tugatilgan: 8/10")
- Boshlash tasdiq oynasi (vaqt, savollar soni)
- `/test/[id]`: bitta savol ekranda, oldinga/orqaga, savollar raqamlari paneli (javob berilganlari belgilangan), taymer, avtosaqlash (saqlanish holati ko'rinadi), "Topshirish" tasdig'i
- `shuffleQuestions` bo'lsa, tartib attempt uchun bir marta aralashtiriladi va saqlanadi (yangilansa o'zgarmaydi)
- Taymer tugaganda avtomatik topshirish. Server deadline qoidasini qo'llaydi
- `lib/grading.ts` + Vitest (SINGLE, MULTIPLE, javobsiz savol, muddat o'tgani)
- `/result/[attemptId]`: ball, foiz, vaqt, test reytingidagi o'rni, (ruxsat bo'lsa) savollar bo'yicha tahlil

**Tayyor:** DevTools Network'da test davomida `isCorrect` ko'rinmaydi; sahifa yangilansa javoblar va taymer saqlanib qoladi; vaqt tugasa avtomatik topshiriladi.

### 6-bosqich: reyting
- `lib/leaderboard.ts`: test reytingi va umumiy reyting (`$queryRaw` + `RANK()`), `finalizeExpiredAttempts`
- `GET /api/leaderboard`
- UI: tablar "Mening guruhim" / "Umumiy", ustunlar: o'rin, ism, (umumiyda) guruh, ball, vaqt. Top 3 uchun medal, o'quvchining o'z qatori ajratilgan, top 50 dan tashqarida bo'lsa pastda "Siz: N-o'rin"
- O'qituvchi uchun guruh tanlash dropdown'i
- Vitest: tartiblash, teng ball va vaqt, faqat birinchi urinish, guruh filtri

**Tayyor:** o'quvchi URL'ni o'zgartirib boshqa guruh reytingini olish orqali tizimni aldab bo'lmaydi; qayta ishlash reytingni o'zgartirmaydi.

### 7-bosqich: o'qituvchi statistikasi
- `/teacher/tests/[id]/results`: o'quvchilar natijalari jadvali (guruh filtri, saralash), CSV'ga eksport
- Savollar bo'yicha statistika: necha foiz to'g'ri javob bergan, eng qiyin 5 ta savol
- Bitta o'quvchining attemptini batafsil ko'rish
- O'qituvchi o'quvchiga qayta ishlash ruxsatini berishi (attemptni bekor qilish)

### 8-bosqich: sayqal va deploy
- Loading/error/empty holatlari, toast xabarlar, 404 sahifa
- Telefon ekranida barcha sahifalarni tekshirish
- Vercel + Neon deploy, prod migratsiya va seed (faqat teacher akkaunti)
- README: o'rnatish, env, deploy yo'riqnomasi

---

## Keyingi versiyalar (hozir qilinmaydi)
- Savollarga rasm va kod bloklari
- Savollar banki (testlar orasida qayta ishlatish)
- AI orqali savol generatsiyasi
- React Native mobil ilova
