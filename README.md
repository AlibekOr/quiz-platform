# Test platformasi

O'quv markaz uchun onlayn test platformasi. O'qituvchi guruhlar, o'quvchilar, dars jadvali va davomatni yuritadi, test yaratadi, natijalar va statistikani ko'radi. O'quvchilar o'qituvchi bergan login/parol bilan kirib test ishlaydi, natijasini va reytingni ko'radi.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS + shadcn/ui, PostgreSQL + Prisma 7, Zod, Vitest. Deploy: Vercel + Neon.

Loyiha qoidalari: [`CLAUDE.md`](CLAUDE.md), reja va biznes qoidalar: [`PLAN.md`](PLAN.md).

## Lokal o'rnatish

Kerak: Node.js 20+ (24 tavsiya), pnpm, PostgreSQL 15+.

```bash
pnpm install                 # postinstall: prisma generate
cp .env.example .env         # qiymatlarni to'ldiring (pastga qarang)
pnpm db:migrate              # migratsiyalarni qo'llash
pnpm db:seed                 # o'qituvchi + 2 guruh, 10 o'quvchi, namunaviy test va davomat
pnpm dev                     # http://localhost:3000
```

Kirish: `.env` dagi `SEED_TEACHER_USERNAME` / `SEED_TEACHER_PASSWORD` (o'qituvchi). Namunaviy o'quvchilar: `student11`…`student15`, `student21`…`student25`, paroli `SEED_STUDENT_PASSWORD`.

## Muhit o'zgaruvchilari

| O'zgaruvchi             | Majburiy       | Tavsif                                                                                                |
| ----------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | ha             | PostgreSQL ulanish satri. Neon'da **pooled** satr (host'ida `-pooler`)                                |
| `DIRECT_URL`            | yo'q           | Faqat migratsiyalar uchun to'g'ridan-to'g'ri (pooler'siz) satr. Berilmasa, `DATABASE_URL` ishlatiladi |
| `JWT_SECRET`            | ha             | Sessiya kaliti, kamida 32 belgi: `openssl rand -base64 32`                                            |
| `SEED_TEACHER_USERNAME` | seed uchun     | O'qituvchi logini                                                                                     |
| `SEED_TEACHER_PASSWORD` | seed uchun     | O'qituvchi paroli (prod'da kamida 8 belgi)                                                            |
| `SEED_TEACHER_FULLNAME` | yo'q           | O'qituvchi ismi (standart: "O'qituvchi")                                                              |
| `SEED_STUDENT_PASSWORD` | faqat dev seed | Namunaviy o'quvchilar paroli                                                                          |
| `TEST_DATABASE_URL`     | testlar uchun  | Reyting/urinish SQL testlari uchun **alohida** baza. Har testda tozalanadi, asosiy bazani bermang     |

Sirlar faqat `.env` da saqlanadi (gitga tushmaydi).

## Buyruqlar

```bash
pnpm dev             # dev server
pnpm build           # production build
pnpm lint            # ESLint
pnpm typecheck       # route tiplari + tsc --noEmit
pnpm test            # Vitest: unit + db (TEST_DATABASE_URL kerak)
pnpm format          # Prettier
pnpm db:migrate      # yangi migratsiya yaratish/qo'llash (dev)
pnpm db:deploy       # mavjud migratsiyalarni qo'llash (prod)
pnpm db:seed         # namunaviy ma'lumotlar (dev)
pnpm db:seed:prod    # faqat o'qituvchi akkaunti (prod)
pnpm db:studio       # Prisma Studio
```

Testlar ikki qismdan iborat: `unit` (bazasiz) va `db` (`*.db.test.ts`, haqiqiy Postgres'da). `db` testlaridan oldin test bazasiga migratsiyalar avtomatik qo'llanadi.

## Deploy: Vercel + Neon

### 1. Neon bazasi

1. [neon.tech](https://neon.tech) da loyiha yarating. Region: Yevropa, masalan `eu-central-1` (Frankfurt), O'zbekistonga eng yaqini.
2. **Connection details** dan ikkita satrni oling:
   - **Pooled** (host'ida `-pooler` bor) → `DATABASE_URL`
   - **Direct** (pooler'siz) → `DIRECT_URL`

### 2. Kodni GitHub'ga joylash

```bash
git remote add origin git@github.com:<user>/quiz-platform.git
git push -u origin main
```

### 3. Vercel loyihasi

1. [vercel.com/new](https://vercel.com/new) → GitHub reponi import qiling. Framework: Next.js (avtomatik aniqlanadi), paket menejeri: pnpm.
2. **Settings → Environment Variables** (Production):
   - `DATABASE_URL`, `DIRECT_URL`: Neon satrlari
   - `JWT_SECRET`: yangi kalit (`openssl rand -base64 32`), dev kalitini ishlatmang
3. **Settings → Functions → Region**: Neon bazasi bilan bir xil region (masalan, Frankfurt `fra1`).
4. Deploy. Build vaqtida `vercel-build` skripti ishlaydi: avval `prisma migrate deploy`, keyin `next build`. Ya'ni migratsiyalar har deployda avtomatik qo'llanadi.

> Preview deploylar ham `vercel-build` ni ishlatadi. Agar Preview muhitiga prod bazasi berilgan bo'lsa, preview ham prod bazasini migratsiya qiladi. Preview uchun alohida Neon branch bering yoki Preview'da `DATABASE_URL`/`DIRECT_URL` ni bermang.

### 4. O'qituvchi akkaunti (bir marta)

Lokal kompyuterdan, prod bazaga ulanib:

```bash
DATABASE_URL="<neon pooled>" \
SEED_TEACHER_USERNAME="teacher" \
SEED_TEACHER_PASSWORD="<kuchli parol>" \
SEED_TEACHER_FULLNAME="Ism Familiya" \
pnpm db:seed:prod
```

Bu faqat o'qituvchi akkauntini yaratadi (mavjud bo'lsa, tegmaydi). Namunaviy o'quvchi va testlar yaratilmaydi. Keyin o'qituvchi tizimga kirib, guruh va o'quvchilarni o'zi qo'shadi (Excel import ham bor).

### 5. Tekshirish

- `https://<loyiha>.vercel.app/login` → o'qituvchi bilan kirish
- Guruh, o'quvchi va test yaratib, o'quvchi akkaunti bilan telefondan test ishlab ko'rish

## Tuzilma

```
src/
  app/            # sahifalar: (auth) login, (student) o'quvchi, (teacher) o'qituvchi, api/
  components/     # ui/ (shadcn), umumiy va bo'limlar bo'yicha komponentlar
  lib/            # auth, baholash, reyting, natijalar, davomat, vaqt (Asia/Tashkent), validatorlar
  proxy.ts        # login/rol bo'yicha yo'naltirish (asosiy himoya server tomonda)
prisma/           # schema, migratsiyalar, seed
```
# quiz-platform
# quiz-platform
# quiz-platform
# quiz-platform
# quiz-platform
# quiz-platform
# quiz-platform
