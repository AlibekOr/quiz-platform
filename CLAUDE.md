@AGENTS.md

# Quiz platform

O'qituvchi/o'quvchi test platformasi. **Yagona manba: `PLAN.md`** — rollar, Prisma sxema, biznes qoidalar, sahifalar va 8 bosqich o'sha yerda. Kod yozishdan oldin tegishli bo'limni o'qi; reja bilan zid narsa qilma, kerak bo'lsa avval so'ra.

## Stek
- Next.js 16 (App Router, `src/app`), React 19, TypeScript strict, Tailwind v4, pnpm
- Rejalashtirilgan: shadcn/ui, Prisma + PostgreSQL (Neon), `jose` (JWT), Vitest, Prettier, Vercel deploy
- Alias: `@/*` → `src/*`
- Next 16: middleware o'rniga `proxy.ts`. API'ni xotiradan yozma — `node_modules/next/dist/docs/01-app/` dagi guide'ni o'qi

## Ish tartibi
- Bosqichma-bosqich (PLAN.md "Bosqichlar"). Har bosqich oxirida **to'xta va hisobot ber**; `pnpm lint`, `pnpm typecheck`, `pnpm test` o'tishi shart
- O'zgartirishlar Server Actions orqali; yagona API — `GET /api/leaderboard`
- Foydalanuvchiga ko'rinadigan matnlar o'zbek tilida (lotin)

## Xavfsizlik invariantlari (buzilmasin)
- Test ishlash paytida klientga `isCorrect` hech qachon yuborilmaydi
- O'quvchi uchun `groupId` faqat sessiyadan olinadi, URL/parametrdan emas
- Har bir server action/route o'z guard'ini chaqiradi (`requireTeacher()` / `requireStudent()`); `proxy.ts` yagona himoya emas
- `/result/[attemptId]` — faqat attempt egasi
- Deadline + 5s dan keyin javob qabul qilinmaydi; `isFirst` tranzaksiya ichida
- Login xatosi doim umumiy: "Login yoki parol noto'g'ri"

## Skill va agentlar (qachon nima)
| Vazifa | Ishlatiladi |
|---|---|
| Bosqichni boshlash/rejalash | `/ecc:plan`, `ecc:planner` agent |
| Yangi feature (TDD bilan) | `/ecc:feature-dev`, `ecc:tdd-workflow`, `ecc:tdd-guide` |
| Next.js / React kod | `ecc:nextjs-turbopack`, `ecc:react-patterns`, `ecc:frontend-patterns` |
| Prisma sxema, migratsiya, `$queryRaw` + `RANK()` | `ecc:prisma-patterns`, `ecc:database-migrations`, `supabase-postgres-best-practices`, `ecc:database-reviewer` |
| Auth, guardlar, rate limit | `ecc:security-review`, `ecc:security-reviewer` agent |
| Vitest testlar | `/ecc:react-test`, `ecc:react-testing`, `/ecc:test-coverage` |
| Build/type xatolari | `/ecc:react-build`, `/ecc:build-fix` |
| Kod review (bosqich oxirida) | `/code-review`, `ecc:typescript-reviewer`, `ecc:react-reviewer` |
| UI (shadcn, mobil, a11y) | `ecc:frontend-a11y`, `ecc:design-system` |
| E2E (5–6-bosqich oqimlari) | `ecc:e2e-testing`, `ecc:e2e-runner` |
| Deploy (8-bosqich) | `ecc:deployment-patterns` |
| Commit | `/ecc:prp-commit` |

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
