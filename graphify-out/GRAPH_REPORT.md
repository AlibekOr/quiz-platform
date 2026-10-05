# Graph Report - quiz-platform  (2026-10-05)

## Corpus Check
- 147 files · ~39,925 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 780 nodes · 2440 edges · 30 communities (24 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1fcc2ca6`
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
- README.md
- AGENTS.md
- app/layout.tsx
- postcss.config.mjs
- eslint.config.mjs
- Button
- auth/actions.ts
- .prettierrc.json
- requireTeacher
- tests/actions.ts
- lib/leaderboard.ts
- dotenv
- students/actions.ts
- test-runner.tsx
- contact.ts
- students/import.ts
- groups/actions.ts
- Test platformasi: loyiha qoidalari
- attendance/actions.ts
- excel.ts

## God Nodes (most connected - your core abstractions)
1. `Button()` - 57 edges
2. `requireTeacher()` - 53 edges
3. `next` - 47 edges
4. `react` - 36 edges
5. `Input()` - 34 edges
6. `db` - 31 edges
7. `lucide-react` - 30 edges
8. `Badge()` - 24 edges
9. `applyServerErrors()` - 22 edges
10. `FormError()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `7-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `Majburiy qoidalar` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Majburiy qoidalar` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (30 total, 6 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (21): name, packageManager, private, version, class-variance-authority, next-themes, pg, prettier (+13 more)

### Community 2 - "time.ts"
Cohesion: 0.06
Nodes (65): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SCHEDULES, SeedQuestion, exceljs (+57 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+9 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.12
Nodes (16): 1-bosqich: loyiha asosi, 2-bosqich: autentifikatsiya, 3-bosqich: o'qituvchi, guruhlar va o'quvchilar, 4-bosqich: dars jadvali va davomat, 5-bosqich: testlar va savollar, 6-bosqich: test ishlash, 7-bosqich: reyting, 8-bosqich: o'qituvchi statistikasi (+8 more)

### Community 5 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:studio, dev (+8 more)

### Community 7 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, bcryptjs, class-variance-authority, cn, exceljs, @hookform/resolvers, jose (+14 more)

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 10 - "app/layout.tsx"
Cohesion: 0.33
Nodes (5): geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 12 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, eslint, eslint-config-next, eslint-config-prettier

### Community 13 - "Button"
Cohesion: 0.08
Nodes (65): @base-ui/react, cn, @hookform/resolvers, lucide-react, react, react-hook-form, sonner, createTest() (+57 more)

### Community 14 - "auth/actions.ts"
Cohesion: 0.06
Nodes (49): bcryptjs, jose, GET(), LoginPage(), metadata, StudentLayout(), TeacherLayout(), LogoutButton() (+41 more)

### Community 16 - "requireTeacher"
Cohesion: 0.09
Nodes (49): nextConfig, next, server-only, metadata, GroupPage(), metadata, GroupsPage(), metadata (+41 more)

### Community 17 - "tests/actions.ts"
Cohesion: 0.07
Nodes (43): vitest, createQuestion(), deleteQuestion(), idSchema, importQuestions(), moveQuestion(), nextOrder(), parseQuestionFile() (+35 more)

### Community 18 - "lib/leaderboard.ts"
Cohesion: 0.07
Nodes (32): Home(), LeaderboardPage(), metadata, one(), metadata, one(), TestLeaderboardPage(), LeaderboardView() (+24 more)

### Community 20 - "students/actions.ts"
Cohesion: 0.19
Nodes (14): idSchema, ImportPreview, ImportPreviewRow, ImportResult, fullNameSchema, ResetPasswordInput, resetPasswordSchema, StudentCreateInput (+6 more)

### Community 21 - "test-runner.tsx"
Cohesion: 0.07
Nodes (53): DashboardPage(), metadata, loadAttempt(), metadata, ResultPage(), Stat(), idSchema, saveAnswer() (+45 more)

### Community 22 - "contact.ts"
Cohesion: 0.24
Nodes (11): parseProfile(), EMPTY_PROFILE, normalizePhone(), normalizeTelegram(), optionalPhoneSchema, optionalTelegramSchema, PARENT_RELATIONS, parseParentRelation() (+3 more)

### Community 23 - "students/import.ts"
Cohesion: 0.15
Nodes (16): cellToString(), Column, firstError(), IMPORT_COLUMNS, ImportRow, MAX_IMPORT_ROWS, OPTIONAL_COLUMNS, REQUIRED_COLUMNS (+8 more)

### Community 24 - "groups/actions.ts"
Cohesion: 0.19
Nodes (20): createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), saveSchedule(), createStudent(), groupExists() (+12 more)

### Community 25 - "Test platformasi: loyiha qoidalari"
Cohesion: 0.22
Nodes (8): Buyruqlar, graphify, Ish tartibi, Majburiy qoidalar, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari

### Community 26 - "attendance/actions.ts"
Cohesion: 0.20
Nodes (10): zod, idSchema, ActionResult, ATTENDANCE_STATUSES, AttendanceFormInput, attendanceFormSchema, ScheduleFormInput, scheduleFormSchema (+2 more)

### Community 27 - "excel.ts"
Cohesion: 0.38
Nodes (6): parseStudentFile(), validateAgainstDb(), cellValue(), getUploadedFile(), MAX_UPLOAD_BYTES, readFirstSheet()

## Knowledge Gaps
- **218 isolated node(s):** `metadata`, `metadata`, `metadata`, `MEDALS`, `LINKS` (+213 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 270 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `requireTeacher` to `package.json`, `time.ts`, `app/layout.tsx`, `Button`, `auth/actions.ts`, `tests/actions.ts`, `lib/leaderboard.ts`, `students/actions.ts`, `test-runner.tsx`, `groups/actions.ts`, `attendance/actions.ts`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `time.ts`, `Bosqichlar`, `Button`, `tests/actions.ts`, `lib/leaderboard.ts`, `students/actions.ts`, `groups/actions.ts`, `Test platformasi: loyiha qoidalari`, `attendance/actions.ts`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `react` connect `Button` to `package.json`, `auth/actions.ts`, `requireTeacher`, `tests/actions.ts`, `test-runner.tsx`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `metadata`, `metadata` to the rest of the system?**
  _218 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._