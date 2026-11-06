# Yangi vazifa: ADMIN roli, ko'p o'qituvchi, region va o'qituvchi boshqaradigan menejerlar

Markazga yangi o'qituvchilar qo'shilmoqda, har birining o'z guruhlari va o'quvchilari bor. Har bir o'qituvchi o'z guruhlari, menejerlari, baholash shablonlari va semestrlarini o'zi boshqaradi. Yangi **ADMIN** roli faqat regionlar va o'qituvchilarni boshqaradi hamda butun markazni ko'radi.

`PLAN.md`, `CLAUDE.md` va `TASKS.md` qoidalari amal qilishda davom etadi.

## 0. Ish tartibi (majburiy)

1. Hozirgi kodni o'rganib chiq: `Role` enum, `lib/auth/guards.ts`, `lib/auth/scope.ts` (`getAccessibleGroupIds`), `proxy.ts`, barcha `requireTeacher()` / `requireManager()` / `requireStaff()` chaqiruvlari, `Semester`, `PenaltyType`, `lib/grades.ts`, `DeletionRequest`, `/teacher/*` va `/manager/*` sahifalari, yon panellar.
2. Menga reja ko'rsat:
   - har bir guard chaqiruvi qaysi rol va qaysi doiraga o'tishi ro'yxati;
   - Prisma o'zgarishlari va **mavjud ma'lumotlar migratsiyasi**.
3. Prod bazada real o'quvchilar bor: hech qanday ma'lumot yo'qolmasin.
4. Rejani tasdiqlaganimdan keyin bosqichlarni **ketma-ket** bajar. Har bosqich oxirida `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` o'tsin, keyin to'xta va hisobot ber.
5. **Push qilma.**
6. Oxirida `PLAN.md` va `CLAUDE.md` ni yangila.

---

## 1. Rollar

| Rol | Kim | Doirasi |
|---|---|---|
| **ADMIN** | markaz rahbariyati (yangi alohida akkaunt) | hamma narsa |
| **TEACHER** | o'qituvchi (hozirgi asosiy akkaunt ham TEACHER bo'lib qoladi) | o'z guruhlari, o'z regioni(lari) ichida |
| **MANAGER** | menejer | o'qituvchilar unga biriktirgan guruhlar |
| **STUDENT** | o'quvchi | faqat o'zi |

## 2. Ma'lumotlar modeli

- `Role` enum: `ADMIN`, `TEACHER`, `MANAGER`, `STUDENT`.
- **O'qituvchi regionlari:** `TeacherRegion` (teacherId, regionId, @@unique). Odatda bitta region bo'ladi, lekin bir nechtasi ham mumkin (migratsiya va bir nechta filialda dars beradigan o'qituvchilar uchun). Regionlarni faqat ADMIN biriktiradi.
- **Guruh:** `Group.teacherId` (majburiy) va `Group.regionId` (majburiy). Guruh regioni o'qituvchining regionlaridan biri bo'lishi shart, server buni tekshiradi.
- **Menejer:** `User.regionId` (bitta region). Menejer bir nechta o'qituvchi bilan ishlashi mumkin.
- `TeacherManager` (teacherId, managerId, @@unique): qaysi o'qituvchi qaysi menejer bilan ishlaydi.
- `ManagerGroup` (managerId, groupId, assignedById): menejerga biriktirilgan guruhlar. Biriktiruvchi o'qituvchi faqat **o'z guruhlarini** biriktira oladi.

### Migratsiya

- Hozirgi TEACHER akkaunti **TEACHER bo'lib qoladi**.
- Mavjud barcha guruhlar: `teacherId` = shu o'qituvchi.
- `TeacherRegion`: o'qituvchining mavjud guruhlari qaysi regionlarda bo'lsa, o'shalarning hammasi unga biriktiriladi.
- Regionsiz guruhlar bo'lsa, rejada ro'yxatini ko'rsat va qaysi regionga o'tkazishni mendan so'ra.
- Mavjud menejerlar: `TeacherManager` = hozirgi o'qituvchi. Ularning hozirgi doirasi saqlanib qolishi uchun region bo'yicha ko'rgan guruhlari `ManagerGroup` sifatida yoziladi.
- Mavjud `PenaltyType` va semestr sozlamalari hozirgi o'qituvchiga tegishli bo'ladi (`ownerId`).
- **ADMIN akkaunti** prod'da alohida seed buyrug'i bilan yaratiladi: `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`. `.env.example` va README yangilansin. Dev seed'da: 1 admin, 2 region, 3 o'qituvchi (ikkitasi bitta regionda), 2 menejer (biri ikki o'qituvchi bilan ishlaydi).

## 3. Doira (eng muhim qism)

`lib/auth/scope.ts`:

```
getAccessibleGroupIds(user):
  ADMIN    → barcha guruhlar
  TEACHER  → Group.teacherId = user.id
  MANAGER  → ManagerGroup orqali biriktirilgan guruhlar (faqat o'z regionida)
```

- O'quvchilar, davomat, uyga vazifa, baholar, jarimalar, testlar, natijalar, Excel eksport va o'quvchi kartochkasi (aloqa ma'lumotlari bilan): **hammasi** shu doira bilan filtrlanadi.
- Doiradan tashqaridagi `id` bilan kelgan so'rov **403** qaytaradi. O'qituvchi URL'ni o'zgartirib boshqa o'qituvchining guruhiga, o'quvchisiga yoki shablonlariga kira olmasligi kerak.
- Rol, region, biriktirishlar va `tokenVersion` har so'rovda bazadan tekshiriladi.
- `CLAUDE.md` dagi guard va shaxsiy ma'lumotlar qoidalari yangilansin: `requireAdmin()`, `requireTeacher()`, `requireManager()`, `requireStaff()`. Shaxsiy ma'lumotlarni faqat doirasida bo'lgan xodim ko'radi.

## 4. Huquqlar

| Amal | ADMIN | TEACHER | MANAGER |
|---|---|---|---|
| Regionlar CRUD | ✅ | ❌ | ❌ |
| O'qituvchilar: yaratish, regionga biriktirish, bloklash, parol tiklash | ✅ | ❌ | ❌ |
| Menejer yaratish | ✅ | ✅ faqat o'z regioniga | ❌ |
| O'z regionidagi mavjud menejer bilan ishlashni boshlash (`TeacherManager`) | ✅ | ✅ | ❌ |
| Menejerga guruh biriktirish va olib tashlash | ✅ | ✅ faqat o'z guruhlarini | ❌ |
| Menejer bilan ishlashni to'xtatish | ✅ | ✅ (faqat o'z biriktirishlari olib tashlanadi) | ❌ |
| Menejer parolini tiklash va bloklash | ✅ | ✅ faqat o'zi yaratgan menejer bo'lsa | ❌ |
| Guruh yaratish, tahrirlash, dars jadvali | ✅ | ✅ o'zi uchun, o'z regionida | ko'rish |
| O'quvchi qo'shish va tahrirlash | ✅ | ✅ o'z guruhlariga | ✅ biriktirilgan guruhlarga |
| O'quvchini o'z guruhlari orasida o'tkazish | ✅ | ✅ | ❌ |
| O'quvchini boshqa o'qituvchiga o'tkazish | ✅ | ❌ | ❌ |
| O'quvchini arxivlash va butunlay o'chirish | ✅ | ✅ o'z o'quvchilari, tasdiqsiz | so'rov yuboradi |
| Menejerning o'chirish so'rovlarini tasdiqlash | ✅ | ✅ (so'rov guruh o'qituvchisiga keladi) | ❌ |
| Baholash shablonlari, jarima shablonlari, semestrlar | ko'rish | ✅ o'zinikini | ❌ |
| Davomat belgilash, vazifa, ball, jarima qo'yish | ✅ | ✅ | ❌ (avvalgidek) |
| Davomat hisoboti va Excel | ✅ | ✅ | ✅ |
| Testlar | ✅ | ✅ | ✅ (avvalgidek) |
| Markaz statistikasi | ✅ | o'z statistikasi | ❌ |

- Menejer huquqlari avvalgidek qoladi, faqat doirasi endi o'qituvchilar biriktirgan guruhlar bilan belgilanadi. O'chirish so'rovi guruh o'qituvchisiga boradi.
- Menejerni bir nechta o'qituvchi ishlatsa, u har bir o'qituvchining faqat o'zi biriktirgan guruhlarini ko'radi. O'qituvchi boshqa o'qituvchining menejerga bergan guruhlarini ko'rmaydi.
- O'qituvchi menejer yaratganda, menejerning regioni o'qituvchining regionlaridan biri bo'lishi shart. O'z regionidagi mavjud menejerlar ro'yxatidan tanlash ham mumkin (ism va username bilan; aloqa ma'lumotlarisiz).

## 5. Baholash shablonlari (o'qituvchi o'zi yaratadi)

Avvalgi qotirilgan 30/20/10/40 tizimi endi **o'qituvchining shabloni** bo'ladi.

- **GradingTemplate:** ownerId, name, maxTotal, passScore (yoki passPercent), failBelow, isDefault.
- **GradeCategory** (shablon ichida, o'qituvchi qo'shadi, o'chiradi, tartiblaydi): name ("Uyga vazifa", "Amaliy", "Og'zaki", "Qo'shimcha", "Bonus" yoki o'zi o'ylab topgani), kind (`ASSIGNMENT` | `ORAL` | `EXTRA` | `BONUS`), cap (kategoriya chegarasi; null bo'lsa chegarasiz), itemMin, itemMax, step (masalan uyga vazifa uchun 0..1, qadam 0.5).
- `EXTRA` qoidasi shablondan olinadi: semestr tugagach, `failBelow ≤ jami < passScore` bo'lsa ruxsat beriladi.
- **Validatsiya:**
  - failBelow < passScore ≤ maxTotal;
  - itemMin ≤ itemMax;
  - cap ≥ 0;
  - jami doim maxTotal bilan cheklanadi;
  - jarima 0 dan pastga tushirmaydi.
- Har bir o'qituvchi uchun hozirgi tizim (60 / 36 / 10; Uyga vazifa 30 (0–1, 0.5 qadam), Amaliy 20, Og'zaki 10, Qo'shimcha 40, Bonus chegarasiz) **default shablon** sifatida yaratiladi.
- **Semester:** groupId, templateId, name, startDate, endDate, closed. O'qituvchi o'z guruhi uchun yaratadi va shablon tanlaydi. Semestr yaratilganda shablon qiymatlari semestrga **nusxalanadi** (snapshot), shunda keyin shablon o'zgarsa eski semestr baholari buzilmaydi.
- Vazifa (`Assignment`) kategoriyasi semestr shablonidagi `GradeCategory` ga bog'lanadi. Ball shu kategoriyaning itemMin..itemMax oralig'ida va qadami bo'yicha qo'yiladi.
- **Jarima shablonlari:** `PenaltyType.ownerId` = o'qituvchi. O'qituvchi o'zi xohlagan nom va ballni kiritadi. Har bir o'qituvchiga namunaviy shablonlar nusxalanadi.
- `lib/grades.ts` sof funksiya bo'lib qoladi, lekin chegaralar va kategoriyalarni semestr snapshot'idan oladi. Mavjud testlar yangi tuzilmaga moslashtiriladi.
- Sahifalar: teacher → Sozlamalar ▾ → Baholash shablonlari, Jarima shablonlari, Semestrlar.

## 6. Sahifalar va navigatsiya

### ADMIN (`/admin/*`)

```
Statistika          (markaz bo'yicha: regionlar, o'qituvchilar, guruhlar, o'quvchilar,
                     davomat %, o'tayotgan / qo'shimcha / yiqilganlar, uyga vazifa berilmagan darslar;
                     region va o'qituvchi filtri; Excel)
Regionlar
O'qituvchilar       (yaratish, regionlar, guruhlari, menejerlari, statistikasi)
Menejerlar          (barchasi, kim bilan ishlaydi)
Guruhlar            (barchasi, filtrlar)
O'quvchilar         (barchasi, filtrlar, boshqa o'qituvchiga o'tkazish)
─────────────
Profil
Chiqish
```

ADMIN davomat, baholar va vazifalarni istalgan guruh bo'yicha ko'rishi mumkin (o'quvchi va guruh kartochkalaridan).

### TEACHER (`/teacher/*`)

```
Bosh sahifa          (bugungi darslarim, uyga vazifa berilmagan darslar, o'tmayotganlar)
Guruhlarim
O'quvchilarim
Davomat ▾            (yuritish, hisobot)
Umumiy baholash ▾    (uyga vazifalar, testlar, baholar)
Statistikam
Sozlamalar ▾         (menejerlarim, so'rovlar (badge), baholash shablonlari, jarima shablonlari, semestrlar)
─────────────
Profil
Chiqish
```

- **Menejerlarim:** yangi menejer yaratish yoki o'z regionidagi mavjudini qo'shish; har bir menejerga o'z guruhlarini checkbox bilan biriktirish; ishlashni to'xtatish.
- Avvalgi umumiy "Regionlar" sahifasi teacher panelidan olib tashlanadi va ADMIN'ga o'tadi.

### MANAGER

Avvalgidek. Bosh sahifada qaysi o'qituvchilar bilan ishlayotgani va biriktirilgan guruhlari ko'rinadi.

### Umumiy

- `proxy.ts`: `/admin/*` faqat ADMIN, `/teacher/*` faqat TEACHER, `/manager/*` faqat MANAGER. Login'dan keyin har rol o'z sahifasiga yo'naltiriladi.
- Davomat, baholar, vazifalar va testlar komponentlari takrorlanmasin: bitta komponent, doira bilan.

## 7. Reyting

- O'quvchi uchun tablar: **"Mening guruhim"** va **"O'qituvchim guruhlari"** (o'z o'qituvchisining barcha guruhlari). Har xil o'qituvchilar har xil shablon ishlatgani uchun ular aralashtirilmaydi.
- ADMIN: istalgan o'qituvchi yoki guruh bo'yicha. Turli shablonlarni solishtirish uchun foizni (jami / maxTotal) ko'rsatish mumkin.

## 8. Bosqichlar

1. **Model va migratsiya:** ADMIN roli, TeacherRegion, Group.teacherId, TeacherManager, ManagerGroup, ownerId'lar, mavjud ma'lumotlar, seed va env.
2. **Doira va guard'lar:** yangi `getAccessibleGroupIds`, barcha server action, route va so'rovlarni tekshirish.
3. **Teacher: menejerlar va guruhlar:** menejer yaratish yoki qo'shish, guruh biriktirish, guruh yaratish, o'quvchini o'chirish, so'rovlar.
4. **Baholash shablonlari va semestrlar:** GradingTemplate, GradeCategory, snapshot, `lib/grades.ts` moslashuvi, jarima shablonlari owner bo'yicha.
5. **Admin paneli va statistika.**
6. **Reyting va yakuniy tozalash.**

## 9. Testlar (Vitest), kamida

- **Doira:** TEACHER faqat o'z guruhlari; boshqa o'qituvchining o'quvchisi, davomati, bali, aloqa ma'lumotlari, shablonlari → 403.
- **Menejer doirasi:** ikki o'qituvchi bitta menejer bilan ishlaganda, har biri faqat o'zi biriktirgan guruhlarni boshqara oladi, menejer esa ikkalasini ko'radi.
- **Menejer regioni:** o'qituvchi o'z regionidan tashqarida menejer yarata yoki qo'sha olmaydi; boshqa o'qituvchining guruhini biriktira olmaydi.
- **Guruh regioni:** guruh regioni o'qituvchi regionlaridan biri bo'lmasa rad etiladi.
- **O'chirish:** TEACHER o'z o'quvchisini tasdiqsiz o'chira oladi; MANAGER faqat so'raydi va so'rov guruh o'qituvchisiga boradi.
- **Shablon validatsiyasi:** failBelow < passScore ≤ maxTotal, itemMin ≤ itemMax, qadam bo'yicha ball.
- **Snapshot:** shablon o'zgarganda eski semestr balari o'zgarmaydi.
- **Default shablon:** eski tizim bilan bir xil natija beradi (60, 36, 10, 30/20/10/40).
- **ADMIN:** hamma narsani ko'radi; o'qituvchi yaratib, regionga biriktira oladi.
- **Migratsiya:** hozirgi akkaunt TEACHER bo'lib qolgan, guruhlari, menejerlari va baholari saqlangan.
