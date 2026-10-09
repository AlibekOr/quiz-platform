# Test platformasi: loyiha qoidalari

O'quv markaz o'quvchilari uchun onlayn test platformasi. O'qituvchi test yaratadi, o'quvchilar akkauntini ochadi, guruhlar dars jadvali va davomatini yuritadi. O'quvchilar login/parol bilan kirib test ishlaydi va reytingni ko'radi. Menejerlar o'z doirasidagi (region + biriktirilgan guruhlar) o'quvchilarni boshqaradi.

Batafsil reja va bosqichlar `PLAN.md` faylida. Har doim joriy bosqichni o'sha yerdan o'qi.

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
    (student)/dashboard/  test/[id]/  result/[attemptId]/  leaderboard/  grades/
    (teacher)/teacher/tests/  teacher/students/  teacher/groups/  teacher/attendance/
    (teacher)/teacher/homework/  teacher/grades/  teacher/managers/  teacher/requests/
    (manager)/manager/  manager/students/  manager/attendance/  manager/requests/  manager/tests/
    api/leaderboard/route.ts
    api/attendance/export/route.ts
    api/grades/export/route.ts
  components/ui/        # shadcn
  components/           # umumiy komponentlar (staff/tests — o'qituvchi va menejer test sahifalari)
  lib/
    db.ts               # Prisma client (singleton)
    auth/               # session.ts, password.ts, guards.ts, scope.ts (menejer doirasi), routes.ts
    deletion-requests.ts # o'chirish so'rovlari (menejer so'raydi, o'qituvchi hal qiladi)
    grading.ts          # baholash logikasi
    attendance.ts       # davomat hisobi va Excel eksport
    time.ts             # Asia/Tashkent vaqt yordamchilari
    leaderboard.ts      # reyting so'rovlari
    grades.ts           # baholar hisobi (sof funksiyalar); grades-data.ts, grades-excel.ts
    memberships.ts      # guruh a'zoligi davrlari; memberships-data.ts
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
10. **O'quvchilarning shaxsiy ma'lumotlari** (`StudentProfile`: telefonlar, Telegram, ota-ona) faqat o'qituvchiga va menejerga (faqat o'z doirasidagi o'quvchilar) ko'rinadi. O'quvchi sahifalari, reyting va o'quvchi uchun API javoblarida bu ma'lumotlar hech qachon `select` qilinmaydi. Ular logga ham yozilmaydi.
11. Sirlar faqat `.env` da: `DATABASE_URL`, `DIRECT_URL` (ixtiyoriy, migratsiya uchun), `JWT_SECRET`, `SEED_TEACHER_USERNAME`, `SEED_TEACHER_PASSWORD`. `.env.example` yangilab bor.
12. **Menejer doirasi** (`lib/auth/scope.ts`): `getAccessibleGroupIds(user)` = menejer regionidagi guruhlar ∪ `ManagerGroup` orqali biriktirilganlar (o'qituvchi uchun hammasi). Menejer uchun BARCHA so'rovlar (o'quvchilar, davomat, eksport, import) shu ro'yxat bilan filtrlanadi: `studentScopeWhere`, `groupScopeWhere`, `canAccessGroup`, `canAccessStudent`. Guruhsiz o'quvchini menejer faqat o'zi qo'shgan bo'lsa (`createdById`) ko'radi. Doiradan tashqaridagi id bilan kelgan so'rov rad etiladi: action'da `FORBIDDEN`, API'da 403. Menejer o'quvchini arxivlay yoki o'chira olmaydi — faqat `DeletionRequest` yuboradi. Testlar: `lib/tests/access.ts` (`getTestAccess`) — menejer faqat o'zi yaratgan va barcha guruhlari doirada bo'lgan testni tahrirlaydi; natijalar, statistika va reyting faqat doiradagi o'quvchilar bo'yicha. Davrga biriktirish, uyga vazifa va baholar faqat o'qituvchida.

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
