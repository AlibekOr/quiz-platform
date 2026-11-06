# ROLES.md rejasi (tasdiqlash uchun)

Holat: 2026-11-06, `feat/roles` branch. `main` ga tegilmagan, push qilinmagan.
Javob berilgan qarorlar: ROLES.md + 2026-11-06 dagi suhbat. Ochiq savollar oxirida (§7).

---

## 1. Asosiy g'oya: doira

Hozir `Scope` = `{ kind: "all" }` (o'qituvchi) yoki `{ kind: "manager", groupIds }`.
Yangi:

```
Scope =
  { kind: "all" }                                       // ADMIN
  { kind: "limited", userId, role, groupIds }           // TEACHER va MANAGER

getAccessibleGroupIds(user):
  ADMIN    → barcha guruhlar
  TEACHER  → Group.teacherId = user.id
  MANAGER  → ManagerGroup orqali biriktirilganlar (regiondan avtomatik ko'rish YO'Q)
```

Menejer uchun allaqachon ishlab turgan barcha filtrlar (`studentScopeWhere`,
`groupScopeWhere`, `canAccessGroup`, `canAccessStudent`, `testScopeWhere`) endi
o'qituvchiga ham qo'llanadi. Asosiy ish — hozir doirasiz yozilgan o'qituvchi sahifalari va
`lib/*-data.ts` funksiyalariga doira qo'shish (§3 jadval).

Guruhsiz o'quvchi: uni qo'shgan o'qituvchi + admin. Menejer qo'shgan bo'lsa — o'sha menejer
va u ishlaydigan o'qituvchilar (`TeacherManager`).

---

## 2. Prisma o'zgarishlari (1-bosqich)

| Model                    | O'zgarish                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Role`                   | `ADMIN` qo'shiladi                                                                                                                                                                                                                                                                                                                                                                                           |
| `TeacherRegion` (yangi)  | `teacherId`, `regionId`, `@@unique([teacherId, regionId])`                                                                                                                                                                                                                                                                                                                                                   |
| `Group`                  | `teacherId` (majburiy, backfill'dan keyin NOT NULL); `name` endi `@unique` emas (takrorlansa bo'ladi); `seq Int @unique` (butun loyiha bo'yicha, Postgres SEQUENCE — o'chirilgan raqam qayta berilmaydi); `code String? @unique` (masalan `SHOA-1-SH`, bir marta yoziladi, o'zgarmaydi); `regionId` bazada ixtiyoriy qoladi (regionsiz eski guruhlar uchun), lekin yangi guruh faqat region bilan yaratiladi |
| `TeacherManager` (yangi) | `teacherId`, `managerId`, `@@unique`                                                                                                                                                                                                                                                                                                                                                                         |
| `ManagerGroup`           | `assignedById` qo'shiladi (kim biriktirgan)                                                                                                                                                                                                                                                                                                                                                                  |
| `PenaltyType`            | `ownerId` qo'shiladi; `name @unique` → `@@unique([ownerId, name])`                                                                                                                                                                                                                                                                                                                                           |
| `Test`                   | `ownerId` (o'qituvchi; menejer yaratgan testda null), `copiedFromId` (nusxa qayerdan); `createdById` (muallif) qoladi                                                                                                                                                                                                                                                                                        |
| `TestShare` (yangi)      | `testId`, `regionId?`, `teacherId?` — test kimga ulashilgan                                                                                                                                                                                                                                                                                                                                                  |
| `User`                   | o'zgarmaydi: `regionId` (menejer), `createdById` (kim yaratgan) — bor                                                                                                                                                                                                                                                                                                                                        |

Baholash shablonlari (4-bosqichda, alohida migratsiya):

| Model                      | O'zgarish                                                                                                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GradingTemplate` (yangi)  | `ownerId`, `name`, `maxTotal`, `passPercent`, `failBelow`, `isDefault`, EXTRA sozlamalari: `extraCap Int?` (null = chegarasiz), `extraMode` (`ANYTIME` — hammaga istalgan vaqtda / `AFTER_END_BAND` — semestr tugagach, `failBelow ≤ jami < o'tish`), `extraBeyondMax Bool` (60 dan oshirishi mumkinmi) |
| `GradeCategory` (yangi)    | `templateId`, `name`, `kind` (`ASSIGNMENT`/`ORAL`/`EXTRA`/`BONUS`), `cap Float?`, `itemMin`, `itemMax`, `step`, `order`                                                                                                                                                                                 |
| `SemesterCategory` (yangi) | semestr yaratilganda shablon kategoriyalari shu yerga **nusxalanadi** (snapshot)                                                                                                                                                                                                                        |
| `Semester`                 | `templateId?` qo'shiladi; hozirgi qoidalar ustunlari snapshot sifatida qoladi; `extraCap` qayta ishlatiladi (null bo'lishi mumkin) + `extraMode`, `extraBeyondMax`                                                                                                                                      |
| `Assignment`               | `semesterCategoryId` qo'shiladi; eski `category` enum backfill uchun qoladi                                                                                                                                                                                                                             |

### Mavjud ma'lumotlar migratsiyasi (hech narsa o'chmaydi)

Hammasi bitta SQL migratsiyada, `INSERT ... ON CONFLICT DO NOTHING` bilan:

1. Bazada aynan **bitta** TEACHER bo'lishi tekshiriladi (bo'lmasa migratsiya to'xtaydi).
2. Barcha guruhlar: `teacherId` = shu o'qituvchi. Keyin `teacherId` NOT NULL.
3. `TeacherRegion` = guruhlari bor barcha regionlar.
4. Har bir menejer: `TeacherManager` = shu o'qituvchi. Hozir region orqali ko'rayotgan
   guruhlari `ManagerGroup` ga yoziladi (doira o'zgarmaydi). Eski `ManagerGroup` lar qoladi.
5. `PenaltyType.ownerId` = shu o'qituvchi.
6. `Test.ownerId` = shu o'qituvchi (o'qituvchi yaratgan testlar). Menejer yaratganlarida null.
7. `Group.seq` = yaratilgan sanasi bo'yicha 1, 2, 3...; `code` = region + o'qituvchi +
   raqam + nom harfi (regionsiz guruhda — §7 savol 1).
8. (4-bosqich) Sizning shabloningiz = **bugungi qoidalar** (60 / 36 / 10, 30/20/10,
   qo'shimcha chegarasiz, `ANYTIME`, `extraBeyondMax = true`). Mavjud semestrlar shu
   shablonga bog'lanadi, snapshot hozirgi qiymatlardan olinadi → ballar o'zgarmaydi.
   Yangi o'qituvchilar ROLES.md §5 default bilan boshlaydi (40, `AFTER_END_BAND`, 60 dan oshmaydi).

Prod'dan oldin: `pg_dump` + Neon backup branch (2026-10-11 dagidek). Migratsiya testlari
(`*.db.test.ts`) eski ma'lumot holatidan migratsiyani o'tkazib, hech narsa yo'qolmaganini tekshiradi.

ADMIN: `pnpm db:seed:admin` (`SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`). `.env.example`,
README yangilanadi. Dev seed: 1 admin, 2 region, 3 o'qituvchi (ikkitasi bitta regionda),
2 menejer (biri ikki o'qituvchi bilan).

---

## 3. Guard va doira jadvali (2-bosqich)

`proxy.ts` / `routes.ts`: `/admin/*` → ADMIN, `/teacher/*` → TEACHER, `/manager/*` → MANAGER.
`requireAdmin()` qo'shiladi. Belgilar: **D** = doira bilan filtrlanadi / tekshiriladi
(doiradan tashqari id → action'da `FORBIDDEN`, API'da 403), **O** = egasi bo'yicha (`ownerId`).

### Teacher sahifalari va action'lar

| Fayl                                                                  | Hozir                                  | Yangi                                                                                                                                           |
| --------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `teacher/layout.tsx`, `teacher/page.tsx` (bosh sahifa)                | `requireTeacher`, hammasi              | `requireTeacher` + D: bugungi darslar, statistikalar, uyga vazifa berilmagan darslar (`getMissingHomeworkLessons(groupIds)`), ko'p qoldirganlar |
| `groups/page`, `groups/[id]`, `groups/[id]/attendance`                | hammasi                                | D (`canAccessGroup`, aks holda 404)                                                                                                             |
| `groups/actions`: `createGroup`                                       | —                                      | `teacherId = user.id`, region o'qituvchi regionlaridan biri bo'lishi shart, `seq`/`code` beriladi                                               |
| `groups/actions`: `renameGroup`, `saveSchedule`, `deleteGroup`        | —                                      | D (faqat o'z guruhi)                                                                                                                            |
| `groups/actions`: `setGroupRegion`                                    | —                                      | faqat o'z regionlari ichida; kod o'zgarmaydi                                                                                                    |
| `students/page`, `students/[id]`, `students/import`, `archive/page`   | hammasi                                | D (`studentScopeWhere`); arxiv — oxirgi guruhi o'qituvchiniki bo'lganlar                                                                        |
| `students/actions` (5 ta + import)                                    | `getScope` bor (o'qituvchi = all)      | o'zgarmaydi, doira avtomatik torayadi; `transferStudents` — faqat o'z guruhlari orasida; boshqa o'qituvchiga — faqat ADMIN                      |
| `students/actions`: `setStudentArchived`, `deleteStudent`             | o'qituvchi                             | D (o'z o'quvchisi, tasdiqsiz)                                                                                                                   |
| `attendance/page`, `attendance/[groupId]/[date]`, `attendance/report` | hammasi                                | D                                                                                                                                               |
| `attendance/actions`: `saveAttendance`                                | —                                      | D (guruh)                                                                                                                                       |
| `homework/page`, `homework/[id]`, `homework/actions` (4 ta)           | hammasi                                | D (semestr → guruh)                                                                                                                             |
| `grades/page`, `grades/actions` (semestr, tuzatishlar)                | hammasi                                | D; semestr yaratish — o'z guruhiga, o'z shabloni bilan                                                                                          |
| `penalties/page`, `penalties/actions` (shablonlar 3 ta)               | hammasi                                | O (`ownerId`); kesh kaliti egaga bog'lanadi                                                                                                     |
| `penalties/actions`: `applyPenaltyAction`, `deletePenalty`            | —                                      | D (o'quvchi + semestr)                                                                                                                          |
| `managers/page`, `managers/actions` (5 ta)                            | barcha menejerlar                      | faqat `TeacherManager` orqali o'zinikilar; yaratish — o'z regioniga; parol/blok — faqat o'zi yaratgan; `setManagerGroups` — faqat o'z guruhlari |
| `managers/actions`: `createRegion`, `renameRegion`; `regions/page`    | o'qituvchi                             | **ADMIN** ga ko'chadi, teacher'dan olib tashlanadi                                                                                              |
| `requests/page`, `requests/actions`                                   | barcha so'rovlar                       | faqat o'z guruhlaridagi o'quvchilar so'rovlari                                                                                                  |
| `tests/*` (8 sahifa), `tests/actions` (13 ta)                         | `getTestAccess` (o'qituvchi = hammasi) | `testScopeWhere`: o'z testlari (`ownerId`) + doiradagi guruhlarga berilganlar; ulashilganlar — faqat nusxa olish uchun ko'rinadi                |

### Menejer, umumiy, API

| Fayl                                                                                   | Yangi                                                                            |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `manager/*` (layout, bosh sahifa, students, attendance, requests, tests ×8)            | `requireManager` qoladi, doira = `ManagerGroup`                                  |
| `manager/students/actions`: `requestStudentDeletion`                                   | so'rov guruh o'qituvchisiga boradi                                               |
| `lib/deletion-requests.ts`                                                             | `decideDeletionRequest` — guruh o'qituvchisi yoki ADMIN                          |
| `api/attendance/export`, `api/students/export`, `api/grades/export`, `api/leaderboard` | D, tashqarisi 403                                                                |
| `lib/leaderboard-access.ts`, `leaderboard/page`                                        | §6 (reyting)                                                                     |
| `profile/actions`                                                                      | o'zgarmaydi (o'zi)                                                               |
| `lib/cached-data.ts`                                                                   | regionlar: o'qituvchiga faqat o'z regionlari; jarima shablonlari: egasi bo'yicha |

Doirasiz yozilgan `lib` funksiyalari (parametr qo'shiladi): `getMissingHomeworkLessons`,
`getSemesterGrades` (chaqiruvchi semestrni tekshiradi), `getAttendanceReport*`,
`getSemesterLeaderboard`, `getOverallLeaderboard`, `getTestResults`.

---

## 4. Bosqichlar

1. **Model va migratsiya** (§2): ADMIN, TeacherRegion, Group.teacherId/seq/code, TeacherManager,
   ManagerGroup.assignedById, ownerId'lar, Test sharing modellari, seed va env.
2. **Doira va guard'lar** (§3) + doira testlari.
3. **Teacher: menejerlar va guruhlar:** menejer yaratish/qo'shish, guruhlarni checkbox bilan
   biriktirish, guruh yaratish (kod bilan), o'quvchini o'chirish, so'rovlar. Guruh kodi barcha
   ro'yxatlarda nom yonida ko'rinadi.
4. **Baholash shablonlari va semestrlar:** GradingTemplate, kategoriyalar, snapshot,
   `lib/grades.ts` snapshot'dan o'qiydi, jarima shablonlari egasi bo'yicha.
5. **Admin paneli va statistika:** statistika, regionlar, o'qituvchilar, menejerlar, guruhlar
   (regionsiz guruhlar ro'yxati shu yerda), o'quvchilar (boshqa o'qituvchiga o'tkazish).
   Davomat, baholar, vazifalar komponentlari teacher bilan umumiy, doira bilan.
6. **Reyting, test ulashish va yakuniy tozalash:** "Mening guruhim" / "O'qituvchim guruhlari",
   admin foiz bilan; test ulashish (region yoki o'qituvchi) va nusxa olish; `PLAN.md`,
   `CLAUDE.md` yangilanadi.

Har bosqich oxirida: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, keyin to'xtab
hisobot. Push qilinmaydi.

---

## 5. Guruh kodi

`lib/group-code.ts` (sof funksiya, testlar bilan — allaqachon yozildi):

```
kod = REGION_HARFI + O'QITUVCHI_HARFLARI + "-" + seq + "-" + NOM_HARFI
```

- Harf = so'zning birinchi harfi, o'zbekcha **Sh** va **Ch** bitta harf (`SH`, `CH`),
  apostrof tashlanadi (O' → `O`, G' → `G`).
- O'qituvchi = familiya + ism harflari ("Orakbaev Alibek" → `OA`).
- Misollar: Shomanay + Orakbaev Alibek + 1 + "Shomanay 135 16:00" → `SHOA-1-SH`;
  Xojeli + ... + 3 + "Xojeli 246" → `XOA-3-X`.

---

## 6. Reyting

- O'quvchi: "Mening guruhim" va "O'qituvchim guruhlari" (o'z o'qituvchisining barcha
  guruhlari; turli shablonlar aralashmaydi).
- Menejer: doirasidagi guruhlar (yig'indilar, avvalgidek).
- ADMIN: istalgan o'qituvchi yoki guruh, foiz (jami / maxTotal) bilan.

---

## 7. Ochiq savollar (javobingiz kerak)

1. **Regionsiz guruhning kodi.** Kod region harfidan boshlanadi, lekin regionsiz guruhga
   regionni keyin admin beradi. Taklif: kod region birinchi marta berilganda yoziladi,
   ungacha "—" ko'rinadi (keyin o'zgarmaydi).
2. **Menejerga regionidan tashqari guruh.** Hozir `ManagerGroup` aynan "regiondan tashqari
   qo'shimcha guruhlar" uchun. ROLES.md "faqat o'z regionida" deydi. Taklif: cheklov
   qo'ymaslik (o'qituvchi o'z guruhlaridan istaganini biriktiradi), aks holda prod'dagi
   mavjud biriktirishlar yo'qolishi mumkin.
3. **Bitta o'qituvchida bir xil nomli ikki guruh** bo'lishi mumkinmi? (Kod farqlaydi.)
   Taklif: bitta o'qituvchi ichida nom takrorlanmasin, o'qituvchilar orasida — mumkin.
4. **Prod ma'lumoti** (quyidagi SQL natijasi): regionsiz guruhlar, menejerlar regionlari.

### Neon'da ishga tushirish uchun SQL (faqat o'qiydi, hech narsa o'zgartirmaydi)

Neon → loyiha → **SQL Editor** → quyidagini qo'yib **Run**:

```sql
SELECT 'teachers' AS what, count(*)::text AS value, NULL AS extra FROM "User" WHERE role = 'TEACHER'
UNION ALL
SELECT 'group', g.name, coalesce(r.name, '— REGIONSIZ —')
  FROM "Group" g LEFT JOIN "Region" r ON r.id = g."regionId"
UNION ALL
SELECT 'manager', u.username, coalesce(r.name, '— REGIONSIZ —')
  FROM "User" u LEFT JOIN "Region" r ON r.id = u."regionId" WHERE u.role = 'MANAGER'
UNION ALL
SELECT 'manager-extra-group', m.username, g.name
  FROM "ManagerGroup" mg JOIN "User" m ON m.id = mg."managerId" JOIN "Group" g ON g.id = mg."groupId"
UNION ALL
SELECT 'tests-by-manager', count(*)::text, NULL
  FROM "Test" t JOIN "User" u ON u.id = t."createdById" WHERE u.role = 'MANAGER';
```

Natijani skrinshot qiling (unda parol yoki ulanish satri yo'q).
