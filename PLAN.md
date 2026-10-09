# Test platformasi: ish rejasi

## Rollar va asosiy imkoniyatlar

**O'qituvchi (TEACHER)**
- Guruhlar yaratadi va har bir guruhning dars jadvalini kiritadi (qaysi kunlari, soat nechada)
- Har bir dars uchun davomat belgilaydi (kim keldi, kim kelmadi) va uni Excel'ga yuklab oladi
- O'quvchi akkauntlarini ochadi: bittalab yoki Excel'dan import qiladi. Parolni tiklaydi, akkauntni bloklaydi, guruhdan chiqaradi, arxivlaydi va (arxivdan) butunlay o'chiradi
- O'quvchilarning shaxsiy ma'lumotlarini yuritadi: o'quvchi telefoni va Telegrami, ota yoki onasining ismi va telefoni
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

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
}

enum ParentRelation {
  FATHER
  MOTHER
  OTHER
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
  archivedAt   DateTime? // arxivlangan (yumshoq o'chirilgan) o'quvchi
  groupId      String?   // hozirgi guruh; GroupMembership bilan doim mos
  group        Group?    @relation(fields: [groupId], references: [id])
  memberships  GroupMembership[]
  attempts     Attempt[]
  attendances  Attendance[]
  profile      StudentProfile?
  createdTests Test[]    @relation("TestAuthor")
  createdAt    DateTime  @default(now())
}

model Group {
  id        String   @id @default(cuid())
  name      String   @unique
  students  User[]
  tests     Test[]
  schedules GroupSchedule[]
  lessons   Lesson[]
  memberships GroupMembership[]
  createdAt DateTime @default(now())
}

model Test {
  id               String     @id @default(cuid())
  title            String
  description      String?
  durationMin      Int
  isActive         Boolean    @default(false)
  allowRetake      Boolean    @default(true)
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

// O'quvchining shaxsiy va aloqa ma'lumotlari (faqat o'qituvchi ko'radi)
model StudentProfile {
  id             String          @id @default(cuid())
  userId         String          @unique
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  phone          String?         // +998901234567
  telegram       String?         // @username yoki +998...
  parentName     String?
  parentRelation ParentRelation?
  parentPhone    String?
  note           String?
  updatedAt      DateTime        @updatedAt
}

// Guruhning haftalik dars jadvali: har bir dars kuni uchun bitta qator
model GroupSchedule {
  id        String @id @default(cuid())
  groupId   String
  group     Group  @relation(fields: [groupId], references: [id], onDelete: Cascade)
  weekday   Int    // 1 = Dushanba ... 7 = Yakshanba
  startTime String // "14:00"
  endTime   String // "16:00"

  @@unique([groupId, weekday])
}

// Bitta o'tilgan dars (ma'lum sana)
model Lesson {
  id          String       @id @default(cuid())
  groupId     String
  group       Group        @relation(fields: [groupId], references: [id], onDelete: Cascade)
  date        DateTime     @db.Date
  topic       String?
  attendances Attendance[]
  createdAt   DateTime     @default(now())

  @@unique([groupId, date])
}

model Attendance {
  id        String           @id @default(cuid())
  lessonId  String
  lesson    Lesson           @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  studentId String
  student   User             @relation(fields: [studentId], references: [id], onDelete: Cascade)
  status    AttendanceStatus
  note      String?
  updatedAt DateTime         @updatedAt

  @@unique([lessonId, studentId])
}
// O'quvchining guruhlar tarixi. leftAt = null — hozirgi guruh.
// Bir o'quvchida faqat bitta ochiq a'zolik: qisman unique indeks (faqat SQL migratsiyada)
model GroupMembership {
  id        String    @id @default(cuid())
  studentId String
  student   User      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  groupId   String
  group     Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  joinedAt  DateTime
  leftAt    DateTime?
  note      String?
  createdAt DateTime  @default(now())

  @@index([studentId, joinedAt])
  @@index([groupId, joinedAt])
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
- `allowRetake` standart holatda `true`: testlar asosiy imtihonga tayyorlov uchun, o'quvchi xohlagancha qayta ishlaydi. O'qituvchi o'chirsa (`false`), `FINISHED/EXPIRED` attempt bor ekan, qayta boshlab bo'lmaydi.
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
- Bloklangan (`isActive = false`) va arxivlangan (`archivedAt` bor) o'quvchilar reytingda ko'rinmaydi. Guruhsiz o'quvchi faqat "Umumiy" reytingda chiqadi.

**Davomat**
- Vaqt zonasi: `Asia/Tashkent`. "Bugun" va dars sanasi shu zonada hisoblanadi (server UTC'da ishlasa ham).
- Davomat sahifasi ochilganda bugungi kun jadvaliga ko'ra dars bo'lishi kerak bo'lgan guruhlar ko'rsatiladi. Jadvalda bo'lmagan kunga ham qo'lda dars qo'shish mumkin (qo'shimcha dars).
- `Lesson` birinchi marta davomat saqlanganda yaratiladi (bir guruh + bir sana = bitta dars).
- Davomat sahifasida o'sha kuni (a'zolik tarixi bo'yicha) guruh a'zosi bo'lgan faol o'quvchilar chiqadi. Avval saqlangan dars ochilsa, o'sha darsdagi yozuvlar ham chiqadi (o'quvchi keyin boshqa guruhga o'tgan bo'lsa ham tarix saqlanadi).
- Hisobotda o'quvchi faqat a'zolik davri ichidagi darslarda hisobga olinadi (davrdan tashqari kataklar kulrang). Guruhdan ketgan o'quvchi hisobotda "o'tkazilgan: [guruh], [sana]" yoki "guruhdan chiqarilgan, [sana]" belgisi bilan qoladi (Excel'da ham).
- Statuslar: `PRESENT` (keldi), `ABSENT` (kelmadi), `LATE` (kechikdi). Hisobotda `LATE` "keldi" deb hisoblanadi. Alohida "sababli" status yo'q: sababli qolgan o'quvchi ham `ABSENT` (kelmadi) bo'ladi va foizga kelmagan sifatida kiradi. Sababini `note` maydoniga yozish mumkin.
- Kelajakdagi sana uchun davomat belgilab bo'lmaydi. O'tgan darslarni tahrirlash mumkin.
- Davomatni faqat o'qituvchi ko'radi va o'zgartiradi.

**Davomatni Excel'ga eksport (exceljs)**
- Parametrlar: guruh + davr (oy yoki ixtiyoriy `from`–`to`).
- Varaq tuzilmasi: tepada guruh nomi, dars jadvali va davr; qatorlar o'quvchilar (alifbo bo'yicha), ustunlar dars sanalari (`04.10`), kataklarda `+` (keldi), `−` (kelmadi), `K` (kechikdi). Agar `note` bo'lsa, katakka izoh (comment) sifatida qo'shiladi.
- Oxirgi ustunlar: kelgan, kelmagan, davomat foizi. Pastki qatorda har bir dars bo'yicha kelganlar soni.
- Ranglar: `−` qizil fon, `K` sariq. Sarlavha qatori va birinchi ustun muzlatilgan (freeze).
- Fayl nomi: `davomat_<guruh>_<YYYY-MM>.xlsx`.

**Auth**
- Login: username + parol. Xato bo'lsa umumiy xabar: "Login yoki parol noto'g'ri".
- Session: JWT (`jose`, HS256), payload: `userId`, `role`, `sessionVersion`. Guruh tokenda saqlanmaydi: har so'rovda bazadan olinadi (o'quvchi o'tkazilsa, eski sessiya ham yangi guruhni ko'radi). httpOnly, secure, sameSite=lax cookie, muddati 7 kun.
- Login urinishlariga oddiy cheklov: bir username uchun 15 daqiqada 10 ta xato bo'lsa, vaqtincha bloklanadi.
- `isActive = false` yoki `archivedAt` bor bo'lsa, kira olmaydi (ochiq sessiya ham ishlamay qoladi).
- Ro'yxatdan o'tish sahifasi YO'Q. Akkauntlarni faqat o'qituvchi yaratadi.

**O'quvchini guruhdan chiqarish, arxivlash va o'chirish**
- **Guruhdan chiqarish:** `groupId = null`, ochiq a'zolik yopiladi (`leftAt = now()`). Test natijalari va davomat tarixi saqlanadi. Guruhsiz o'quvchi testlarni ko'rmaydi, guruh reytingida chiqmaydi, keyin "Guruhga qo'shish" orqali guruhga qo'shiladi.
- **Arxivlash (yumshoq o'chirish):** `archivedAt = now()`, `sessionVersion` oshadi. Arxivdagi o'quvchi kira olmaydi; o'quvchilar ro'yxati, guruh sahifasi, reyting, davomat sahifalari va hisobotlari, test natijalari, bosh sahifa hisoblari va Excel eksportda ko'rinmaydi. Natijalari bazada qoladi. Guruhi saqlanadi, tiklanganda o'sha guruhga qaytadi (guruh o'chirilgan bo'lsa, guruhsiz qoladi).
- **Tiklash:** `archivedAt = null`. Faqat "Arxiv" filtrida.
- **Butunlay o'chirish:** faqat arxivdagi o'quvchi, tasdiq oynasi bilan. O'quvchi, uning urinishlari va javoblari, davomati va profili o'chadi. Qaytarib bo'lmaydi.
- Guruhni o'chirishda arxivdagi o'quvchilar to'sqinlik qilmaydi (ular guruhsiz qoladi).

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
| `/teacher/groups/[id]` | teacher | Guruh tafsilotlari: o'quvchilar (guruhdan chiqarish), dars jadvali |
| `/teacher/attendance` | teacher | Bugungi darslar (jadval bo'yicha), boshqa sanani tanlash, qo'shimcha dars qo'shish |
| `/teacher/attendance/[groupId]/[date]` | teacher | Davomat belgilash |
| `/teacher/groups/[id]/attendance` | teacher | Davomat hisoboti (o'quvchilar × sanalar jadvali), Excel'ga yuklab olish |
| `/teacher/students` | teacher | O'quvchilar ro'yxati, qo'shish, Excel import/eksport, parol tiklash, bloklash, boshqa guruhga o'tkazish (bir nechtasini tanlab ham), guruhdan chiqarish, arxivlash. Filtrlar: guruh, "Guruhsiz", "Arxiv" (tiklash, butunlay o'chirish) |
| `/teacher/students/[id]` | teacher | O'quvchi kartochkasi: shaxsiy va aloqa ma'lumotlari, guruhi va guruhlar tarixi, boshqa guruhga o'tkazish, test natijalari, davomat foizi |
| `/teacher/tests` | teacher | Testlar ro'yxati, yaratish |
| `/teacher/tests/[id]` | teacher | Tahrirlash: savollar, sozlamalar, guruhlar, import |
| `/teacher/tests/[id]/results` | teacher | Natijalar jadvali, savollar bo'yicha statistika |

API: `GET /api/leaderboard?testId=&scope=group|all&groupId=` (`testId` bo'lmasa umumiy reyting), `GET /api/attendance/export?groupId=&from=&to=` (.xlsx fayl, faqat teacher). Qolgan o'zgartirishlar Server Actions orqali bo'ladi.

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
- `/teacher/students`: jadval (qidiruv ism, telefon va Telegram bo'yicha, guruh filtri), qo'shish, tahrirlash, guruhni o'zgartirish, parolni tiklash, bloklash
- O'quvchi formasi: ism, username, parol, guruh, o'quvchi telefoni, Telegram (`@username` yoki telefon raqami), ota-ona: ismi, kimligi (ota / ona / boshqa), telefoni, izoh. Aloqa maydonlari ixtiyoriy
- Telefon raqamlari `+998XXXXXXXXX` formatiga keltirib saqlanadi (`90 123 45 67`, `901234567`, `+998 90 ...` kabi kiritishlar qabul qilinadi). Telegram `@username` yoki telefon raqami bo'lishi mumkin, Zod bilan tekshiriladi
- `/teacher/students/[id]`: o'quvchi kartochkasi. Telefonlar `tel:` havola (bosganda qo'ng'iroq), Telegram `https://t.me/...` havola
- Excel eksport: guruh bo'yicha o'quvchilar ro'yxati barcha aloqa ma'lumotlari bilan (parol va hash'siz)
- Excel import: ustunlar `fullName | username | password | group | phone | telegram | parentName | parentRelation | parentPhone`. Importdan oldin preview, xatolarni qator bo'yicha ko'rsatish, takror username'larni rad etish

**Tayyor:** 30 ta o'quvchini Excel'dan bir yo'la qo'shsa bo'ladi, ular login qila oladi.

### 4-bosqich: dars jadvali va davomat
- Prisma: `GroupSchedule`, `Lesson`, `Attendance` modellari va `AttendanceStatus` enum (yuqoridagi sxema). Agar 1-bosqichda hali qo'shilmagan bo'lsa, yangi migratsiya
- Vaqt zonasi yordamchilari: `lib/time.ts` (`Asia/Tashkent` bo'yicha bugungi sana, hafta kuni)
- `/teacher/groups/[id]`: dars jadvalini kiritish: hafta kunlarini belgilash va har biriga boshlanish/tugash vaqti. Guruhlar ro'yxatida jadval qisqa ko'rinishda (`Du, Cho, Ju · 14:00–16:00`)
- `/teacher/attendance`: bugun darsi bor guruhlar (kartochkalar, davomat belgilangan yoki belgilanmaganligi), sana tanlagich, qo'shimcha dars qo'shish
- Davomat belgilash sahifasi (mobile-first): o'quvchilar ro'yxati, har birida katta tugmalar (Keldi / Kelmadi / Kechikdi), "Hammasi keldi" tugmasi, "Kelmadi" belgilangan o'quvchi yonida ota-onasining telefoniga `tel:` havola (darrov qo'ng'iroq qilish uchun), ixtiyoriy izoh va dars mavzusi, bitta "Saqlash"
- `/teacher/groups/[id]/attendance`: oy tanlagich, o'quvchilar × sanalar jadvali, har o'quvchining davomat foizi, eng ko'p dars qoldirganlar tepada ajratilgan
- Excel eksport: `GET /api/attendance/export` (yuqoridagi formatda)
- Seed: guruhlarga jadval va o'tgan 2 haftaga namunaviy davomat
- Vitest: davomat foizi hisobi (`LATE` = keldi, `ABSENT` = kelmadi), vaqt zonasi bo'yicha "bugun", Excel fayl tuzilmasi (ustunlar va yig'indilar)

**Tayyor:** telefondan 20 soniya ichida bitta guruh davomatini belgilasa bo'ladi; oylik hisobotni Excel'da ochganda sanalar, belgilar, ranglar va foizlar to'g'ri; o'quvchi davomat sahifalari va eksportga kira olmaydi.

### 5-bosqich: testlar va savollar
- `/teacher/tests`: ro'yxat, yaratish
- `/teacher/tests/[id]`: sozlamalar (vaqt, allowRetake, showAnswers, shuffleQuestions, isActive), guruhlarga biriktirish
- Savol muharriri: qo'shish, tahrirlash, o'chirish, tartibini o'zgartirish, variantlar (kamida 2 ta, kamida 1 ta to'g'ri; SINGLE da aynan 1 ta)
- Savollarni import qilish: JSON (`[{ text, type, points, options: [{ text, isCorrect }] }]`) va Excel (`text | type | points | A | B | C | D | correct`, correct masalan `B` yoki `A,C`). Preview + validatsiya
- Javoblari bor testni o'chirishda ogohlantirish

**Tayyor:** mavjud savollar bazasini import qilib, test yaratib, guruhga faollashtirsa bo'ladi.

### 6-bosqich: test ishlash
- `/dashboard`: o'quvchi guruhidagi faol testlar, holati ("Boshlanmagan", "Davom etmoqda", "Tugatilgan: 8/10")
- Boshlash tasdiq oynasi (vaqt, savollar soni)
- `/test/[id]`: bitta savol ekranda, oldinga/orqaga, savollar raqamlari paneli (javob berilganlari belgilangan), taymer, avtosaqlash (saqlanish holati ko'rinadi), "Topshirish" tasdig'i
- `shuffleQuestions` bo'lsa, tartib attempt uchun bir marta aralashtiriladi va saqlanadi (yangilansa o'zgarmaydi)
- Taymer tugaganda avtomatik topshirish. Server deadline qoidasini qo'llaydi
- `lib/grading.ts` + Vitest (SINGLE, MULTIPLE, javobsiz savol, muddat o'tgani)
- `/result/[attemptId]`: ball, foiz, vaqt, test reytingidagi o'rni, (ruxsat bo'lsa) savollar bo'yicha tahlil

**Tayyor:** DevTools Network'da test davomida `isCorrect` ko'rinmaydi; sahifa yangilansa javoblar va taymer saqlanib qoladi; vaqt tugasa avtomatik topshiriladi.

### 7-bosqich: reyting
- `lib/leaderboard.ts`: test reytingi va umumiy reyting (`$queryRaw` + `RANK()`), `finalizeExpiredAttempts`
- `GET /api/leaderboard`
- UI: tablar "Mening guruhim" / "Umumiy", ustunlar: o'rin, ism, (umumiyda) guruh, ball, vaqt. Top 3 uchun medal, o'quvchining o'z qatori ajratilgan, top 50 dan tashqarida bo'lsa pastda "Siz: N-o'rin"
- O'qituvchi uchun guruh tanlash dropdown'i
- Vitest: tartiblash, teng ball va vaqt, faqat birinchi urinish, guruh filtri

**Tayyor:** o'quvchi URL'ni o'zgartirib boshqa guruh reytingini olish orqali tizimni aldab bo'lmaydi; qayta ishlash reytingni o'zgartirmaydi.

### 8-bosqich: o'qituvchi statistikasi
- `/teacher/tests/[id]/results`: o'quvchilar natijalari jadvali (guruh filtri, saralash), CSV'ga eksport
- Savollar bo'yicha statistika: necha foiz to'g'ri javob bergan, eng qiyin 5 ta savol
- Bitta o'quvchining attemptini batafsil ko'rish
- O'qituvchi attemptni bekor qilishi: attempt va javoblari o'chiriladi. Agar u birinchi urinish bo'lsa, qolganlardan eng birinchisi `isFirst` bo'ladi (yo'q bo'lsa, keyingi yangi urinish birinchi hisoblanadi)

### 9-bosqich: sayqal va deploy
- Loading/error/empty holatlari, toast xabarlar, 404 sahifa
- Telefon ekranida barcha sahifalarni tekshirish
- Vercel + Neon deploy, prod migratsiya va seed (faqat teacher akkaunti)
- README: o'rnatish, env, deploy yo'riqnomasi

### 10-bosqich: o'quvchilarni boshqarish
- Prisma: `User.archivedAt DateTime?` (migratsiya `user_archived_at`)
- Guruhdan chiqarish: `/teacher/students` (amallar menyusi) va `/teacher/groups/[id]` da tugma, tasdiq oynasi bilan. `groupId = null`, natijalar va davomat saqlanadi
- O'quvchilar ro'yxatida "Guruhsiz" va "Arxiv" filtrlari
- Arxivlash: login va sessiya tekshiruvi, reyting (`$queryRaw`), davomat, test natijalari, bosh sahifa, Excel eksport arxivdagilarni chiqarmaydi. "Arxiv" filtridan "Tiklash"
- Butunlay o'chirish: faqat arxivdagi o'quvchi, tasdiq oynasi bilan (server ham tekshiradi)
- Vitest: reytingda arxivdagi o'quvchi ko'rinmaydi, guruhsiz o'quvchi guruh reytingida chiqmaydi

**Tayyor:** guruhdan chiqarilgan o'quvchi testlarni ko'rmaydi, lekin natijalari kartochkasida qoladi; arxivdagi o'quvchi kira olmaydi va hech qayerda ko'rinmaydi, tiklansa hammasi qaytadi; faqat arxivdagini butunlay o'chirsa bo'ladi.

### 11-bosqich: boshqa guruhga o'tkazish
- Prisma: `GroupMembership` (migratsiyalar `group_membership`, `group_membership_one_open`). Mavjud o'quvchilar uchun hozirgi guruhi bo'yicha ochiq a'zolik (`joinedAt = createdAt`)
- `User.groupId` hozirgi guruh bo'lib qoladi. Yaratish, Excel import, guruhdan chiqarish va o'tkazish a'zolikni `groupId` bilan bitta tranzaksiyada o'zgartiradi (`lib/memberships-data.ts`, `moveStudent`). Tahrirlash oynasida guruh maydoni yo'q
- O'tkazish: amallar menyusi va kartochkadagi tugma, jadvalda bir nechtasini tanlab birga. Dialog: yangi guruh, sana (default bugun, Toshkent; kelajak va oxirgi a'zolik o'zgarishidan oldingi sana mumkin emas), izoh. Guruhsiz o'quvchi uchun "Guruhga qo'shish"
- A'zolik `[joinedAt kuni, leftAt kuni)` oralig'idagi darslarni qamraydi: o'tkazish kuni yangi guruhga tegishli
- Davomat varag'i, saqlash va hisobot (sahifa va Excel) a'zolik davri bo'yicha; ketganlar belgi bilan qoladi
- Reyting: guruh reytingida hozirgi a'zolar; test natijalari o'quvchi bilan ko'chadi (`Attempt` o'quvchiga bog'langan)
- Kartochkada guruhlar tarixi: guruh, qachondan, qachongacha, izoh
- Xavfsizlik: faqat `requireTeacher()`; JWT'dan `groupId` olib tashlandi
- Vitest: a'zolik davrlari, ketish belgisi, hisobot a'zolik davri bo'yicha

**Tayyor:** o'quvchi o'tkazilgandan keyin eski sessiyasi bilan ham yangi guruh testlarini ko'radi; eski guruh davomat hisobotida "o'tkazilgan: ..." belgisi bilan qoladi, yangi guruhda faqat o'tkazish sanasidan boshlab hisoblanadi.

### 12-bosqich: ballar tizimi (keyingi, hali boshlanmagan)
O'tkazishdagi ballar varianti shu bosqichda qo'shiladi. Boshlashdan oldin maydonlarni kelishib olish kerak.
- `Test.dueAt DateTime?` (muddat). Davr (`Period`: nomi, sanalar, `passPercent`) va uy vazifasi (`Homework`: muddat, `maxPoints`, o'quvchi ballari)
- `GradeExemption`: `studentId`, `itemType` (`HOMEWORK` | `TEST`), `itemId`, `reason`. Ozod qilingan item jami va maksimal baldan chiqariladi, o'tish chegarasi `passPercent` bo'yicha qayta hisoblanadi
- `PointAdjustment`: `studentId`, `periodId`, `points` (manfiy ham), `reason`, `createdAt`. Kartochkadan qo'shiladi
- O'tkazish dialogida variant: (a) yangi guruhning o'tkazish sanasidan oldingi muddatli vazifa va testlaridan ozod qilish (default), (b) hech narsa qilmaslik
- `lib/grades.ts`; hisobotda ozod kataklar "—" va izoh bilan, tuzatishlar alohida ustunda, Excel'da ham
- Vitest: ozod qilishdan keyin maksimal ball va chegara, manfiy tuzatish, jami `maxPoints`dan oshmasligi

---

## Keyingi versiyalar (hozir qilinmaydi)
- Savollarga rasm va kod bloklari
- Savollar banki (testlar orasida qayta ishlatish)
- AI orqali savol generatsiyasi
- O'quvchi o'z davomatini ko'rishi, davomat bo'yicha ota-onaga xabar (Telegram bot)
- React Native mobil ilova
