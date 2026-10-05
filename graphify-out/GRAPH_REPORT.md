# Graph Report - quiz-platform  (2026-10-05)

## Corpus Check
- 173 files · ~48,114 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 892 nodes · 2805 edges · 28 communities (21 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b3cb9e13`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- package.json
- time.ts
- devDependencies
- Bosqichlar
- components.json
- scripts
- dependencies
- sheet.tsx
- AGENTS.md
- buttonVariants
- postcss.config.mjs
- eslint.config.mjs
- Button
- auth/actions.ts
- .prettierrc.json
- app/layout.tsx
- test-runner.tsx
- dotenv
- PageSkeleton
- requireTeacher
- next
- results/page.tsx
- tests/actions.ts
- students/[id]/page.tsx

## God Nodes (most connected - your core abstractions)
1. `Button()` - 61 edges
2. `requireTeacher()` - 58 edges
3. `next` - 57 edges
4. `lucide-react` - 38 edges
5. `react` - 37 edges
6. `db` - 35 edges
7. `Input()` - 34 edges
8. `Badge()` - 30 edges
9. `buttonVariants` - 26 edges
10. `TestResultsPage()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `7-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `Bosqichlar` --references--> `test()`  [INFERRED]
  PLAN.md → src/lib/leaderboard.db.test.ts
- `Majburiy qoidalar` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Majburiy qoidalar` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (28 total, 7 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.10
Nodes (20): name, packageManager, private, version, class-variance-authority, pg, prettier, prettier-plugin-tailwindcss (+12 more)

### Community 2 - "time.ts"
Cohesion: 0.06
Nodes (70): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SCHEDULES, SeedQuestion, TEACHER_ONLY (+62 more)

### Community 3 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+10 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.05
Nodes (37): Buyruqlar, graphify, Ish tartibi, Majburiy qoidalar, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari (+29 more)

### Community 5 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:seed:prod, db:studio (+9 more)

### Community 7 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, @base-ui/react, bcryptjs, class-variance-authority, cn, exceljs, @hookform/resolvers, jose (+13 more)

### Community 8 - "sheet.tsx"
Cohesion: 0.24
Nodes (11): TeacherLayout(), MobileNav(), LINKS, NavLinks(), Sheet(), SheetContent(), SheetHeader(), SheetOverlay() (+3 more)

### Community 10 - "buttonVariants"
Cohesion: 0.24
Nodes (11): metadata, NotFound(), Error(), metadata, NotFound(), Error(), metadata, NotFound() (+3 more)

### Community 12 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, eslint, eslint-config-next, eslint-config-prettier

### Community 13 - "Button"
Cohesion: 0.08
Nodes (62): @base-ui/react, cn, @hookform/resolvers, lucide-react, react, react-hook-form, sonner, LoginForm() (+54 more)

### Community 14 - "auth/actions.ts"
Cohesion: 0.09
Nodes (36): bcryptjs, jose, LoginPage(), metadata, StudentLayout(), LogoutButton(), Card(), CardContent() (+28 more)

### Community 16 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 18 - "test-runner.tsx"
Cohesion: 0.10
Nodes (39): ATTEMPT_MISSING, idSchema, saveAnswer(), SaveAnswerResult, startAttempt(), submitAttempt(), metadata, requestTime() (+31 more)

### Community 20 - "PageSkeleton"
Cohesion: 0.60
Nodes (3): Loading(), Loading(), PageSkeleton()

### Community 22 - "requireTeacher"
Cohesion: 0.06
Nodes (68): zod, createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), saveSchedule(), createStudent() (+60 more)

### Community 25 - "next"
Cohesion: 0.05
Nodes (51): nextConfig, next, server-only, vitest, GET(), Home(), LeaderboardPage(), metadata (+43 more)

### Community 31 - "results/page.tsx"
Cohesion: 0.05
Nodes (71): GET(), DashboardPage(), metadata, loadAttempt(), MARK_STYLES, MarkBanner(), metadata, ResultPage() (+63 more)

### Community 33 - "tests/actions.ts"
Cohesion: 0.07
Nodes (49): createQuestion(), deleteQuestion(), deleteTest(), idSchema, importQuestions(), moveQuestion(), nextOrder(), parseQuestionFile() (+41 more)

### Community 35 - "students/[id]/page.tsx"
Cohesion: 0.12
Nodes (35): exceljs, GET(), GroupsPage(), metadata, ContactLine(), metadata, StudentCardPage(), ImportStudentsPage() (+27 more)

## Knowledge Gaps
- **242 isolated node(s):** `Lokal o'rnatish`, `Muhit o'zgaruvchilari`, `Buyruqlar`, `1. Neon bazasi`, `2. Kodni GitHub'ga joylash` (+237 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 297 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `time.ts`, `students/[id]/page.tsx`, `tests/actions.ts`, `sheet.tsx`, `buttonVariants`, `Button`, `auth/actions.ts`, `app/layout.tsx`, `test-runner.tsx`, `requireTeacher`, `results/page.tsx`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `tests/actions.ts`, `time.ts`, `students/[id]/page.tsx`, `Bosqichlar`, `test-runner.tsx`, `next`, `results/page.tsx`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Button` to `package.json`, `time.ts`, `students/[id]/page.tsx`, `tests/actions.ts`, `sheet.tsx`, `buttonVariants`, `app/layout.tsx`, `test-runner.tsx`, `next`, `results/page.tsx`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Lokal o'rnatish`, `Muhit o'zgaruvchilari`, `Buyruqlar` to the rest of the system?**
  _242 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._