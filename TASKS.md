# Yangi vazifalar: semestr ball tizimi, uyga vazifa, profil, navigatsiya, davomat hisoboti

Bu fayl bir nechta o'zgarishni bitta joyga yig'adi. `PLAN.md` va `CLAUDE.md` qoidalari amal qilishda davom etadi.

## 0. Ish tartibi (majburiy)

1. Avval hozirgi kodni o'rganib chiq: `Homework`, `Submission`, `GradingPeriod`, `PointAdjustment`, `GradeExemption`, `GroupMembership`, `lib/grades.ts`, yon panel komponentlari, `/teacher/attendance`, `/manager/attendance`.
2. Har bo'lim uchun aniqla: **allaqachon bor**, **qisman bor** yoki **yo'q**. Bor narsani qaytadan yozma, faqat shu faylga moslashtir.
3. Menga reja ko'rsat: bosqichlar, o'zgaradigan modellar va **mavjud ma'lumotlar qanday migratsiya qilinishi**. Prod bazada real o'quvchilar bor, hech qanday ma'lumot yo'qolmasligi kerak.
4. Rejani tasdiqlaganimdan keyin quyidagi bosqichlarni **ketma-ket** bajar. Har bosqich oxirida `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` o'tsin, keyin to'xta va qisqa hisobot ber.
5. **Push qilma**, men tekshiraman.
6. Ish oxirida `PLAN.md` va `CLAUDE.md` ni yangila.

## Qabul qilingan qarorlar

- Testlar semestr baliga **kirmaydi**. Ularning reytingi faqat test sahifalarida.
- Jarimalar 60 ballik chegaradan **keyin** ayiriladi, jami 0 dan pastga tushmaydi.
- Qo'shimcha (EXTRA) ball faqat semestr **tugagandan keyin** va faqat jami **10 ≤ ball < 36** bo'lgan o'quvchiga qo'yiladi.
- Uyga vazifa bali faqat **0, 0.5 yoki 1**.
- Jami **hech qachon 60 dan oshmaydi**.
- Baholash (ball, jarima, vazifa) faqat **TEACHER** uchun. Menejerga yopiq.

---

## 1-bosqich: navigatsiya va davomat hisoboti

### Yon panel (teacher)

```
Bosh sahifa
Guruhlar
O'quvchilar
Davomat ▾
   Davomat yuritish
   Davomat hisoboti
Umumiy baholash ▾
   Uyga vazifalar
   Testlar
   Baholar
Sozlamalar ▾
   Menejerlar
   So'rovlar (badge)
   Regionlar
   Jarima shablonlari
─────────────
Profil
Chiqish
```

- Uchala ochiladigan guruh bitta umumiy komponent (collapsible submenu).
- Joriy sahifa qaysi guruhda bo'lsa, o'sha guruh ochiq va faol band ajratilgan bo'lsin. Ochiq/yopiq holat sahifalar o'rtasida saqlansin.
- Kutilayotgan so'rovlar soni "So'rovlar" yonida, submenu yopiq bo'lsa "Sozlamalar" yonida ham badge bo'lib chiqsin.
- Telefonda hamburger menyu ichida xuddi shu tuzilma.

### Yon panel (manager va student)

- Menejer paneli hozirgi bandlarini saqlaydi (Bosh sahifa, O'quvchilar, Davomat, Testlar, Reyting, So'rovlarim). Pastga **Profil** va **Chiqish** qo'shiladi, uslub teacher paneli bilan bir xil bo'ladi.
- O'quvchi paneli ham shu uslubda tartiblanadi, pastida Profil va Chiqish.

### Davomat

- **Davomat yuritish:** hozirgi `/teacher/attendance` (bugungi darslar, belgilash).
- **Davomat hisoboti:** yangi `/teacher/attendance/report`. Ko'rinishi `/manager/attendance` bilan **bir xil**: guruh tanlash, oy tanlash, davr ma'lumoti, "Eng ko'p dars qoldirganlar" bloki, o'quvchilar × sanalar jadvali, Keldi / Kelmadi / %, "Kelganlar" qatori, belgilar izohi, Excel tugmasi.
- Hisobot jadvali umumiy komponentga chiqariladi (masalan `components/attendance/AttendanceReport.tsx`). Teacher va manager sahifalari shu komponentni ishlatadi, ma'lumotlar `getAccessibleGroupIds` orqali filtrlanadi (teacher uchun barcha guruhlar).
- Faqat o'qituvchida: sana sarlavhasini bosganda o'sha darsning davomat yuritish sahifasi ochiladi (tahrirlash uchun).
- Eski `/teacher/groups/[id]/attendance` shu hisobotga yo'naltiriladi, guruh oldindan tanlangan holda. Kod takrorlanmasin.

---

## 2-bosqich: profil sahifasi (`/profile`, barcha rollar uchun)

- **Hamma uchun:** ism, username, rol.
- **O'quvchi:**
  - guruhi;
  - o'z telefoni va Telegrami (o'zi tahrirlay oladi, `+998XXXXXXXXX` formatiga keltiriladi);
  - ota-ona ma'lumotlari (faqat ko'rish);
  - joriy semestr bali kategoriyalar bo'yicha, jarimalar ro'yxati sabablari bilan, davomat foizi, topshirilmagan vazifalar.
- **Menejer:** region va biriktirilgan guruhlar.
- **Parolni almashtirish:** joriy parol + yangi parol + takrorlash, kamida 8 belgi. Almashtirilgandan keyin boshqa qurilmalardagi sessiyalar bekor bo'ladi (masalan `User.tokenVersion`).
- O'quvchi faqat o'z profilini ko'radi. Boshqa o'quvchilarning ma'lumotlari hech qanday API orqali qaytmaydi.

---

## 3-bosqich: semestr ball tizimi

### Semestr

`GradingPeriod` kengaytiriladi yoki `Semester` ga aylantiriladi. Har guruh uchun:

| Maydon | Default |
|---|---|
| name, startDate, endDate | |
| closed (o'qituvchi semestrni yopishi mumkin) | false |
| maxTotal | 60 |
| passPercent | 60 (o'tish = 36) |
| failBelow | 10 |
| homeworkCap | 30 |
| practicalCap | 20 |
| oralCap | 10 |
| extraCap | 40 |

### Ball manbalari

- **HOMEWORK:** uyga vazifa. Har biri 0 / 0.5 / 1, maxPoints doim 1 va o'zgartirilmaydi. Kategoriya yig'indisi `homeworkCap` bilan cheklanadi.
- **PRACTICAL:** o'qituvchi beradigan amaliy topshiriq. Topshirish va baholash uyga vazifa kabi, maxPoints o'qituvchi belgilaydi. `practicalCap` bilan cheklanadi.
- **ORAL:** og'zaki savol-javob. O'qituvchi dars kuni ball qo'yadi (`OralScore`: studentId, lessonId, points, note). `oralCap` bilan cheklanadi.
- **EXTRA:** semestr oxirida o'ta olmaganlar uchun amaliy vazifa yoki savol-javob. `extraCap` bilan cheklanadi.
- **BONUS:** ixtiyoriy amaliy vazifalar (PRACTICAL'dan alohida). O'qituvchi e'lon qiladi, o'quvchi xohlasa topshiradi. Kategoriya chegarasi yo'q.
- HOMEWORK, PRACTICAL, EXTRA va BONUS uchun bitta `Assignment` modeli (`category` maydoni bilan) va bitta Submission oqimi ishlatiladi. Mavjud `Homework` ma'lumotlari `category = HOMEWORK` sifatida ko'chiriladi.
- Testlardagi `periodPoints` va testning semestrga bog'lanishi olib tashlanadi (migratsiya bilan).

### Hisob (`lib/grades.ts`, sof funksiya)

```
base       = min(hw, homeworkCap) + min(practical, practicalCap) + min(oral, oralCap)
             + bonus + adjustments
withExtra  = base + min(extra, extraCap)
capped     = min(withExtra, maxTotal)
total      = max(0, capped − penalties)
passScore  = maxTotal * passPercent / 100   // 36
```

**Holat:**
- Semestr davom etmoqda → **Jarayonda**
- Semestr tugagan (endDate o'tgan yoki closed) va:
  - total ≥ passScore → **O'tdi**
  - EXTRA'siz jami < failBelow (10) → **Yiqildi**, EXTRA qo'yib bo'lmaydi (server rad etadi)
  - failBelow ≤ EXTRA'siz jami < passScore → **Qo'shimcha imkoniyat**, EXTRA qo'yish mumkin. EXTRA'dan keyin qayta hisoblanadi.

Natija har kategoriya bo'yicha alohida qaytariladi ("yig'ilgan / chegara") — UI va Excel uchun.

`PointAdjustment` (masalan boshqa guruhdan o'tkazilgan o'quvchining ballari) `adjustments` sifatida kiradi, izoh bilan. `GradeExemption` mavjud bo'lsa, yangi tizimda ishlatilmaydi. Uni migratsiya bilan olib tashlash yoki qoldirish haqida rejada taklif ber.

---

## 4-bosqich: uyga vazifa va topshiriqlarni boshqarish

- Uyga vazifa **har darsga** beriladi: `Assignment (HOMEWORK)` Lesson'ga bog'lanadi (`lessonId`). Muddat default holatda guruh jadvali bo'yicha keyingi dars.
- Davomat saqlangandan keyin "Bugungi dars uchun uyga vazifa bering" taklifi chiqadi.
- O'qituvchi bosh sahifasida va Davomat yuritish sahifasida uyga vazifa berilmagan o'tgan darslar ro'yxati (ogohlantirish) ko'rinadi.
- **Tahrirlash:** matn, muddat va (HOMEWORK'dan boshqa kategoriyalarda) maxPoints. maxPoints kamaytirilsa, undan katta qo'yilgan ballar haqida ogohlantirish chiqadi.
- **O'chirish:** tasdiq oynasi bilan. Topshiriqlar bo'lsa "N ta topshiriq va ularning ballari ham o'chadi" ogohlantirishi.
- **Kimlar topshirmadi:** har bir vazifada topshirmaganlar ro'yxati (ota-ona telefoniga `tel:` havola bilan) va "X / Y topshirdi" hisobi.
- **Guruh bo'yicha umumiy ko'rinish:** o'quvchilar × vazifalar jadvali, topshirilmaganlar qizil.
- Baholash UI: HOMEWORK uchun uchta tugma (0 / 0.5 / 1) va izoh; qolganlar uchun 0..maxPoints. "Qayta ishlashga qaytarish" saqlanadi.
- O'quvchi ish GRADED bo'lgunicha yoki RETURNED holatida qayta topshira oladi. Muddatdan keyin topshirilgan ish `isLate` bilan belgilanadi (vaqt Asia/Tashkent bo'yicha).
- O'quvchi sahifalari: `/homework` (kategoriya filtri bilan: Uyga vazifa, Amaliy, Bonus), holat, ball, izoh.

---

## 5-bosqich: jarima shablonlari

- **PenaltyType:** name, defaultPoints, description, isActive. CRUD: Sozlamalar → Jarima shablonlari.
- Seed'dagi namunaviy shablonlar: "Darsga sababsiz kelmaslik", "Uyga vazifani ko'chirish", "Darsda tartibni buzish", "Darsga kechikish".
- **Penalty:** studentId, semesterId, typeId, points (shablondan nusxa olinadi, o'zgartirsa bo'ladi), note, date, createdById.
- **Jarima qo'yish:** o'quvchi tanlanadi, shablonlar tugmalar ko'rinishida chiqadi ("Darsga kechikish −1"), bir bosishda qo'yiladi; izoh va ballni o'zgartirish ixtiyoriy. Bir nechta o'quvchiga bitta shablonni birdaniga qo'llash mumkin.
- Qayerdan qo'yiladi: o'quvchi kartochkasi, Baholar sahifasi, Davomat yuritish sahifasi.
- Jarimani bekor qilish (o'chirish) mumkin.
- Nofaol shablonlar tanlash ro'yxatida chiqmaydi, lekin eski jarimalarda nomi saqlanadi.

---

## 6-bosqich: reyting, hisobot va eksport

- **Bosh sahifa (dashboard) reytingi:** joriy semestrdagi umumiy ball (`total`) bo'yicha, "Mening guruhim" va "Umumiy" tablari. Arxivlangan va guruhsizlar chiqmaydi.
- **Test reytingi** faqat test sahifalarida (`/test/[id]/leaderboard`) qoladi va dashboard'dan olib tashlanadi.
- **Baholar** (`/teacher/grades` yoki `/teacher/groups/[id]/grades`):
  - guruh va semestr tanlash;
  - o'quvchilar × (Uy vazifa, Amaliy, Og'zaki, Bonus, Tuzatish, Qo'shimcha, Jarima, Jami, Holat);
  - har katakda "yig'ilgan / chegara";
  - "Yiqildi" va "Qo'shimcha imkoniyat" qatorlari tepada va rang bilan ajratilgan.
- **Excel:** shu jadval birinchi varaqda, har kategoriya batafsil alohida varaqlarda.

---

## 7-bosqich: guruhga o'tkazish (agar hali qilinmagan bo'lsa)

Bu bosqich mavjudligini 0-bosqichda tekshir. To'liq bo'lsa, faqat yangi ball tizimiga moslashtir.

- **GroupMembership:** studentId, groupId, joinedAt, leftAt, note. Mavjud o'quvchilar uchun migratsiyada yozuv yaratiladi.
- **O'tkazish:** yangi guruh, sana (default bugun), izoh. Bir nechta o'quvchini birdaniga o'tkazish mumkin. Hammasi bitta tranzaksiyada: eski a'zolik yopiladi, yangisi ochiladi, `groupId` yangilanadi.
- Davomat o'quvchini faqat a'zolik davridagi darslarda ko'rsatadi. Eski guruh hisobotida "o'tkazilgan: [guruh], [sana]" belgisi qoladi.
- Eski guruhda yig'ilgan ballarni o'tkazish uchun `PointAdjustment` (izoh bilan).
- O'quvchi kartochkasida guruhlar tarixi ko'rsatiladi.

---

## Huquqlar (barcha bosqichlarda)

- Ball qo'yish, jarima, vazifa yaratish/tahrirlash/o'chirish, semestr sozlamalari: faqat `requireTeacher()`.
- Menejer: davomat hisoboti va testlar faqat o'z doirasida (`getAccessibleGroupIds`). Baholar, uyga vazifa va jarimalar unga yopiq.
- O'quvchi faqat o'z ballari, jarimalari, topshiriqlari va profilini ko'radi.
- Rol, guruh va `tokenVersion` har so'rovda bazadan tekshiriladi.

## Testlar (Vitest), kamida

- **Har kategoriya chegarasi:** 30 / 20 / 10 / 40.
- **Jami 60 dan oshmasligi:** hammasi to'liq va bonus bilan ham.
- **Jarima:** chegaradan keyin ayirilishi va jami 0 dan pastga tushmasligi.
- **Holat chegaralari:** 9.5 → Yiqildi (EXTRA rad etiladi), 10 → Qo'shimcha imkoniyat, 36 → O'tdi.
- **EXTRA vaqti:** semestr tugamaguncha EXTRA qo'yib bo'lmasligi.
- **Uyga vazifa bali:** 0, 0.5 va 1 dan boshqa qiymat rad etilishi.
- **Parol almashtirish:** eski sessiyani bekor qilishi.
- **Doira:** menejer boshqa region guruhining davomat hisobotini ololmasligi.
- **Migratsiya:** mavjud Homework va Submission ma'lumotlari yo'qolmasligi (migratsiyadan keyingi hisob).
