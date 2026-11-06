# Test platformasi: loyiha qoidalari

O'quv markaz o'quvchilari uchun onlayn test platformasi. Rollar: **ADMIN** (regionlar, o'qituvchilar, butun markaz), **TEACHER** (o'z guruhlari: test, o'quvchilar, dars jadvali, davomat, o'z baholash shablonlari bo'yicha semestr ballari, menejerlari), **MANAGER** (o'qituvchilar biriktirgan guruhlar o'quvchilari), **STUDENT** (test ishlaydi, reytingni ko'radi).

Batafsil reja va bosqichlar `PLAN.md` faylida (15–21 — `TASKS.md`, 22–27 — `ROLES.md`, keyingisi — `FEATURES.md`). Har doim joriy bosqichni o'sha yerdan o'qi.

## Stack (o'zgartirma, avval so'ra)

- **Framework:** Next.js 16 (App Router), React 19
- **Til:** TypeScript, `strict: true`. `any` ishlatma
- **Paket menejeri:** pnpm. Build skriptlari (prisma, @prisma/engines, @prisma/client) uchun `pnpm approve-builds` yoki `package.json` dagi `pnpm.onlyBuiltDependencies` ishlatiladi
- **Stil:** Tailwind CSS + shadcn/ui
- **Baza:** PostgreSQL (prod: Neon), ORM: Prisma
- **Auth:** o'zimiz yozamiz. `bcryptjs` (parol hash), `jose` (JWT), httpOnly cookie. NextAuth ISHLATILMAYDI
- **Validatsiya:** Zod (har bir server action va API kirishida)
- **Formalar:** react-hook-form + @hookform/resolvers/zod
- **Excel import:** exceljs
- **Testlar:** Vitest (baholash, reyting, auth logikasi uchun)
- **Deploy:** Vercel + Neon

## Papka tuzilmasi

```
src/
  app/
    (auth)/login/
    (account)/profile/  # barcha rollar
    (student)/dashboard/  test/[id]/  result/[attemptId]/  leaderboard/  grades/  homework/  tests/leaderboard/
    (teacher)/teacher/tests/  teacher/students/  teacher/groups/  teacher/attendance/  teacher/attendance/report/
    (teacher)/teacher/homework/  teacher/grades/  teacher/penalties/  teacher/managers/  teacher/requests/  teacher/archive/
    (teacher)/teacher/templates/  teacher/semesters/  teacher/risk/  teacher/risk/settings/
    (manager)/manager/  manager/students/  manager/attendance/  manager/requests/  manager/tests/
    (admin)/admin/  admin/regions/  admin/teachers/  admin/managers/  admin/groups/  admin/students/  admin/tests/
    api/admin/stats/route.ts
    api/leaderboard/route.ts
    api/attendance/export/route.ts
    api/grades/export/route.ts
  components/ui/        # shadcn
  components/           # umumiy komponentlar (staff/tests — o'qituvchi va menejer test sahifalari)
  lib/
    db.ts               # Prisma client (singleton)
    auth/               # session.ts, password.ts, guards.ts, scope.ts (doira), staff.ts (xodim + doira), routes.ts
    templates.ts        # baholash shablonlari va semestrga nusxa; group-code.ts, groups-data.ts — guruh kodi
    tests/sharing.ts    # test ulashish va nusxa olish; admin-stats.ts — admin statistikasi
    deletion-requests.ts # o'chirish so'rovlari (menejer so'raydi, o'qituvchi hal qiladi)
    grading.ts          # baholash logikasi
    attendance.ts       # davomat hisobi va Excel eksport
    time.ts             # Asia/Tashkent vaqt yordamchilari
    leaderboard.ts      # test reytinglari; semester-leaderboard.ts — semestr reytingi; leaderboard-access.ts
    grades.ts           # semestr bali hisobi (sof funksiyalar, avtomatik jarimalar); grades-data.ts, grades-excel.ts
    homework.ts         # topshiriqlar; homework-data.ts. penalties.ts — jarima shablonlari
    nav.ts              # yon panel mantig'i; clock.ts — soat siferblati (vaqt tanlash)
    memberships.ts      # guruh a'zoligi davrlari; memberships-data.ts
    risk.ts             # xavf signallari (sof); risk-data.ts — doira bo'yicha ro'yxat (menejerga ball signallari yo'q)
    validators/         # Zod sxemalar
  proxy.ts
prisma/
  schema.prisma
  seed.ts
```

## Majburiy qoidalar

1. **To'g'ri javoblar hech qachon brauzerga yuborilmaydi** (test davomida). Test ishlash sahifasi uchun maxsus `select` ishlat: `Option.isCorrect` bo'lmasin. Tekshirish faqat serverda.
2. **Rol tekshiruvi ikki joyda:** `proxy.ts` faqat yo'naltiradi (`lib/auth/routes.ts`), lekin har bir server action va route handler o'zi ham `requireTeacher()` / `requireManager()` / `requireStaff()` / `requireStudent()` chaqiradi. Faqat proxy'ga ishonma. Rol, faollik va region har so'rovda bazadan olinadi (JWT'da faqat `userId`, `role`, `sessionVersion`).
3. **Vaqt serverda hisoblanadi.** Attempt boshlanganda `deadlineAt` yoziladi. Deadline'dan keyin kelgan javob qabul qilinmaydi (5 soniya grace). Klient taymeri faqat ko'rsatish uchun.
4. **Guruh sessiyadan olinadi,** URL yoki body'dan emas (o'quvchi uchun).
5. Barcha kirish ma'lumotlari Zod bilan tekshiriladi.
6. Parollar faqat bcrypt hash ko'rinishida saqlanadi (cost 10). Hech qachon logga yozilmaydi.
7. Interfeys tili: **o'zbekcha (lotin)**. Kod, o'zgaruvchi nomlari va commitlar inglizcha.
8. Mobile-first: o'quvchilar asosan telefondan kiradi.
9. Vaqt zonasi har doim `Asia/Tashkent` (davomat, "bugun", sanalar). Sana va vaqt hisoblari `lib/time.ts` orqali.
10. **O'quvchilarning shaxsiy ma'lumotlari** (`StudentProfile`: telefonlar, Telegram, ota-ona) faqat o'qituvchiga va menejerga (faqat o'z doirasidagi o'quvchilar) ko'rinadi. O'quvchi sahifalari, reyting va o'quvchi uchun API javoblarida bu ma'lumotlar hech qachon `select` qilinmaydi. Yagona istisno: `/profile` da o'quvchi faqat O'ZINING telefoni, Telegrami (tahrirlaydi) va ota-ona ma'lumotlarini (faqat ko'rish) ko'radi (`lib/profile-data.ts`); o'qituvchi izohi (`note`) unga ham yuborilmaydi. Ular logga ham yozilmaydi.
11. Sirlar faqat `.env` da: `DATABASE_URL`, `DIRECT_URL` (ixtiyoriy, migratsiya uchun), `JWT_SECRET`, `SEED_TEACHER_USERNAME`, `SEED_TEACHER_PASSWORD`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`. `.env.example` yangilab bor.
12. **Doira** (`lib/auth/scope.ts`, ROLES.md): `getAccessibleGroupIds(user)` — ADMIN: hammasi; TEACHER: o'z guruhlari (`Group.teacherId`); MANAGER: faqat o'qituvchilar biriktirgan guruhlar (`ManagerGroup`, regiondan avtomatik emas). Server action va sahifalarda `requireTeacherScope()` / `requireStaffScope()` / `requireTeacherOrAdminScope()` (`lib/auth/staff.ts`) va `studentScopeWhere`, `groupScopeWhere`, `canAccessGroup`, `canAccessStudent`, `semesterGroupInScope`. Guruhsiz o'quvchini qo'shgan xodim va uning hamkorlari (`TeacherManager`) ko'radi. Doiradan tashqaridagi id: action'da `FORBIDDEN`, sahifada 404, API'da 403. Menejer o'quvchini arxivlay yoki o'chira olmaydi — `DeletionRequest` yuboradi, uni guruh o'qituvchisi yoki ADMIN hal qiladi. O'qituvchi o'z o'quvchisini tasdiqsiz arxivlaydi. Jarima shablonlari egasi bo'yicha (`ownerId`). Menejerni faqat uni yaratgan o'qituvchi tahrirlaydi; o'qituvchi menejerga faqat o'z regionli guruhlarini biriktiradi. Testlar: `lib/tests/access.ts` (`getTestAccess`). Regionlar — faqat ADMIN. Uyga vazifa, baholar va jarimalar faqat o'qituvchida.
13. **Semestr bali** (`lib/grades.ts`, `lib/grades-data.ts`, `lib/templates.ts`): qoidalar o'qituvchining baholash shablonidan semestrga NUSXALANADI (`SemesterCategory`) — shablon keyin o'zgarsa eski semestr o'zgarmaydi. `jami = max(0, (extraBeyondMax ? min(EXTRA'siz, maxTotal) + EXTRA : min(EXTRA'siz + EXTRA, maxTotal)) − jarimalar)`, o'tish = maxTotal × passPercent; testlar kirmaydi. EXTRA kimga — `extraMode` (ANYTIME yoki tugagach [failBelow, o'tish)). Hozirgi o'qituvchi shabloni: 60/36/10, EXTRA chegarasiz, istalgan vaqtda, 60 dan oshadi; yangi o'qituvchilar standarti — eski 30/20/10/40 tizimi. Kategoriya chegaralari, EXTRA qoidalari va avtomatik jarimalar (uyga vazifaga 0 — vazifaning `missPenalty` si: 2026-10-15 dan beri −2, oldingilarida −1; sababsiz kelmaslik — −1; bazaga yozilmaydi) faqat shu yerda hisoblanadi. Darsga amaliy berilsa, u uyga vazifa o'rnida — o'sha darsga uyga vazifa berilmaydi (`lib/homework.ts`). Ball qo'yish, jarima, topshiriq va semestr sozlamalari — faqat `requireTeacher()`. Menejer reytingda faqat yig'indilarni (to'plagan, jarima, jami) ko'radi — kategoriyalar va jarima sabablari unga yopiq.

## Ish tartibi

- `PLAN.md` dagi bosqichlarni **ketma-ket** bajar. Bir bosqich tugaganda to'xta, nima qilinganini va qanday tekshirishni qisqa yoz, keyin mendan tasdiq kut.
- Har bosqich oxirida: `pnpm lint`, `pnpm typecheck`, `pnpm test` xatosiz o'tishi shart.
- Har bosqich bitta yoki bir nechta mantiqiy commit bo'lsin (Conventional Commits: `feat:`, `fix:` ...).
- Prisma sxemani o'zgartirsang, migratsiya yarat (`prisma migrate dev --name ...`).
- Rejada noaniqlik bo'lsa, taxmin qilma, so'ra.

## Buyruqlar

```
pnpm dev            # dev server
pnpm lint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest
pnpm db:migrate     # prisma migrate dev
pnpm db:seed        # prisma db seed
pnpm db:studio
```

## Next.js 16

@AGENTS.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
