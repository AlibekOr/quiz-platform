# Yangi imkoniyatlar: xavf ostidagi o'quvchilar va savollar banki

Bu vazifa **ROLES.md tugagandan keyin** bajariladi, chunki u yangi rollar, doira (`getAccessibleGroupIds`) va o'qituvchi baholash shablonlariga tayanadi.

`PLAN.md`, `CLAUDE.md`, `TASKS.md` va `ROLES.md` qoidalari amal qilishda davom etadi.

## 0. Ish tartibi (majburiy)

1. Hozirgi kodni o'rganib chiq: `Test`, `Question`, `Option`, `Attempt`, test yaratish va import sahifalari, `lib/grades.ts`, `lib/attendance.ts`, `Assignment` va `Submission`, `Semester` va shablon snapshot'i, bosh sahifalar (admin, teacher, manager).
2. Menga reja ko'rsat: Prisma o'zgarishlari, mavjud ma'lumotlar (testlar va savollar) qanday saqlanib qolishi.
3. Rejani tasdiqlaganimdan keyin **A qism**, keyin **B qism**. Har qism oxirida `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` o'tsin, keyin to'xta va hisobot ber.
4. **Push qilma.** Oxirida `PLAN.md` ni yangila.

---

## A qism: xavf ostidagi o'quvchilar

Maqsad: yiqilishidan oldin yordamga muhtoj o'quvchilarni avtomatik ko'rsatish.

### Qoidalar (`lib/risk.ts`, sof funksiya)

Har bir o'quvchi uchun joriy semestr bo'yicha quyidagi signallar tekshiriladi:

| Signal | Shart (default) |
|---|---|
| **Ketma-ket dars qoldirish** | oxirgi darslarda ketma-ket ≥ 2 ta `ABSENT` (faqat o'quvchi guruhda bo'lgan darslar, `GroupMembership` bo'yicha) |
| **Davomat past** | semestrdagi davomat < 70% (kamida 4 ta dars o'tgandan keyin) |
| **Vazifalar topshirilmagan** | muddati o'tgan oxirgi 3 ta vazifadan ≥ 2 tasi topshirilmagan |
| **Ball sur'ati orqada** | semestrning o'tgan qismi `f = (bugun − start) / (end − start)`. Kutilgan ball = `passScore × f`. Xavf: `jami < kutilgan × 0.8`. Semestr boshidagi birinchi 14 kun tekshirilmaydi |
| **Jarimalar ko'p** | oxirgi 30 kunda jarimalar yig'indisi ≥ 5 ball |

- Har bir signalning **og'irligi** bor. Natijada daraja chiqadi: **Yuqori** (2+ signal yoki "Ball sur'ati orqada" semestrning 70% dan keyin), **O'rta** (1 signal).
- Natija qaysi signal ishlaganini va aniq raqamlarni qaytaradi (masalan "3 dars ketma-ket qoldirgan", "18 / 36 ball, kutilgan 24").
- Arxivlangan va guruhsiz o'quvchilar hisobga olinmaydi. Semestri yopilgan guruhlar ham hisobga olinmaydi.

### Sozlamalar

- `RiskSettings` (teacherId): har bir signal uchun yoqish/o'chirish va chegara qiymatlari. Default qiymatlar yuqoridagi jadvaldagidek.
- Joyi: teacher → Sozlamalar ▾ → **Xavf sozlamalari**.

### Ko'rinishi

- **TEACHER bosh sahifasi:** "Xavf ostidagi o'quvchilar" bloki: daraja bo'yicha tartiblangan, har qatorda ism, guruh, signallar (qisqa yorliqlar), ota-ona telefoniga `tel:` havola, o'quvchi kartochkasiga havola. To'liq ro'yxat uchun alohida sahifa (`/teacher/risk`), guruh va daraja filtrlari bilan.
- **ADMIN statistikasi:** har bir o'qituvchi bo'yicha xavf ostidagi o'quvchilar soni, bosganda ro'yxat. Excel eksport.
- **MANAGER bosh sahifasi:** faqat **davomat va vazifa** signallari, chunki baholar menejerga yopiq. Ball bilan bog'liq ma'lumot menejerga hech qanday API orqali qaytmasligi kerak.
- **O'quvchi kartochkasi:** joriy signallar va ularning tarixi.

### "Ko'rib chiqildi"

- `RiskReview`: studentId, reviewedById, note ("Ota-onasi bilan gaplashildi"), createdAt, hideUntil (default +7 kun).
- Ko'rib chiqilgan o'quvchi `hideUntil` gacha ro'yxatda kulrang va pastda turadi. Yangi signal qo'shilsa, darhol yana yuqoriga chiqadi.
- Izohlar tarixi o'quvchi kartochkasida ko'rinadi (faqat doiradagi xodimlarga).

### Texnik

- Hisob so'rov paytida bajariladi, lekin bitta guruh uchun ma'lumotlar bitta yoki bir nechta so'rov bilan olinadi (N+1 bo'lmasin). Natija qisqa muddatga keshlanadi (masalan 5 daqiqa yoki davomat, ball, jarima o'zgarganda yangilanadi).
- Doira: `getAccessibleGroupIds`.

### Testlar (Vitest)

- Har bir signal: chegaradan biroz past va biroz yuqori qiymatlar.
- Ketma-ket qoldirish o'quvchi guruhga qo'shilishidan oldingi darslarni hisoblamasligi.
- Semestrning birinchi 14 kunida "Ball sur'ati" ishlamasligi.
- Daraja hisobi (o'rta, yuqori).
- Ko'rib chiqilgan o'quvchi yangi signal paydo bo'lganda qayta ko'tarilishi.
- Menejerga ball signallari qaytmasligi.

---

## B qism: savollar banki

Maqsad: o'qituvchi savollarini bir joyda saqlash va yangi testni bankdan tez yig'ish.

### Model

- **Topic:** ownerId (teacher), name ("CSS Flexbox", "JS massivlar"), parentId (ixtiyoriy, ichma-ich mavzular uchun).
- **BankQuestion:** ownerId, topicId, text, type (`SINGLE` | `MULTIPLE`), difficulty (`EASY` | `MEDIUM` | `HARD`), points, explanation (ixtiyoriy), tags (string[]), archivedAt, createdAt.
- **BankOption:** bankQuestionId, text, isCorrect, order.
- **Test savollari nusxa sifatida qoladi.** Bankdan testga qo'shilgan savol testning o'z `Question` / `Option` yozuvlariga **nusxalanadi** va `Question.sourceBankQuestionId` bilan bog'lanadi. Shunda bankdagi savol keyin tahrirlansa yoki o'chirilsa, eski test va urinishlar natijalari o'zgarmaydi. Mavjud testlar va natijalar strukturasi o'zgarmaydi.

### Imkoniyatlar

- **Bank sahifasi** (`/teacher/bank`):
  - mavzular daraxti;
  - savollar ro'yxati: qidiruv, mavzu, qiyinlik, tur va teg filtrlari;
  - qo'shish, tahrirlash, arxivlash va nusxalash;
  - har bir savol qaysi testlarda ishlatilgani va **qanchalik to'g'ri yechilgani** (statistika: urinishlar bo'yicha to'g'ri javob foizi; 10 ta urinishdan kam bo'lsa ko'rsatilmaydi).
- **Import:** mavjud JSON va Excel formatlari bankka ham ishlaydi, qo'shimcha `topic` va `difficulty` ustunlari bilan.
- **Mavjud testlardan bankka saqlash:** test sahifasida "Savollarni bankka saqlash" (mavzu va qiyinlik tanlanadi). Takroriy savollar (bir xil matn va variantlar) aniqlanib, qayta qo'shilmaydi.
- **Testni bankdan yig'ish** (test yaratish sahifasida yangi bo'lim):
  - **Qo'lda tanlash:** filtrlangan ro'yxatdan checkbox bilan.
  - **Avtomatik:** qoidalar ro'yxati, masalan "CSS Flexbox · O'rta · 5 ta" va "CSS Grid · Oson · 3 ta". Server tasodifiy tanlaydi va arxivlanmagan savollardan oladi. Yetarli savol bo'lmasa, nechtasi yetishmayotganini aytadi. Yig'ilgan savollarni saqlashdan oldin ko'rib, ayrimlarini almashtirsa bo'ladi ("Boshqasini tanlash").
  - Shu guruhda oldingi testlarda ishlatilgan savollarni chiqarib tashlash varianti.

### Huquqlar

- Bank **o'qituvchining shaxsiy** banki: faqat egasi ko'radi va o'zgartiradi. ADMIN faqat ko'radi.
- MANAGER bankka kira olmaydi (testlarni avvalgidek qo'lda yaratadi).
- Barcha so'rovlar `ownerId` bo'yicha filtrlanadi, boshqa o'qituvchining savoliga `id` bilan murojaat **403** qaytaradi.
- `BankOption.isCorrect` faqat o'qituvchiga ko'rinadi. Test ishlash paytidagi 1-qoida (to'g'ri javob brauzerga yuborilmaydi) o'zgarmaydi.

### Navigatsiya

TEACHER yon panelidagi **Umumiy baholash ▾** ichiga **Savollar banki** qo'shiladi.

### Testlar (Vitest)

- Bankdan testga nusxalash: bankdagi savol tahrirlanganda test savoli o'zgarmasligi.
- Avtomatik yig'ish: soni va filtrlar bo'yicha to'g'ri tanlash, yetarli bo'lmaganda xabar, takroriy savol tushmasligi, "oldin ishlatilganlarni chiqarish".
- Takroriy savollarni aniqlash.
- Boshqa o'qituvchining banki va savoliga kirish 403.
- Savol statistikasi (to'g'ri javob foizi) hisobi.

---

## Keyinchalik (hozir qilinmaydi)

- Ota-onalar uchun Telegram bot (davomat va haftalik hisobot xabarlari).
- AI orqali bankka savol generatsiyasi.
