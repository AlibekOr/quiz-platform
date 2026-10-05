# Graph Report - quiz-platform  (2026-10-05)

## Corpus Check
- 172 files · ~46,862 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 895 nodes · 2798 edges · 33 communities (26 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fddbb3cb`
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
- tests/actions.ts
- AGENTS.md
- next
- postcss.config.mjs
- eslint.config.mjs
- Button
- guards.ts
- .prettierrc.json
- groups/actions.ts
- validators/attendance.ts
- result/[attemptId]/page.tsx
- dotenv
- PageSkeleton
- server-only
- students/actions.ts
- contact.ts
- students/export/route.ts
- db
- students/import.ts
- results/page.tsx
- requireTeacher
- app/layout.tsx

## God Nodes (most connected - your core abstractions)
1. `Button()` - 61 edges
2. `requireTeacher()` - 58 edges
3. `next` - 56 edges
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
- `Majburiy qoidalar` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Majburiy qoidalar` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (33 total, 7 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.10
Nodes (20): name, packageManager, private, version, class-variance-authority, pg, prettier, prettier-plugin-tailwindcss (+12 more)

### Community 2 - "time.ts"
Cohesion: 0.07
Nodes (60): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SCHEDULES, SeedQuestion, TEACHER_ONLY (+52 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+9 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.04
Nodes (42): Buyruqlar, graphify, Ish tartibi, Majburiy qoidalar, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari (+34 more)

### Community 5 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "scripts"
Cohesion: 0.11
Nodes (18): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:seed:prod, db:studio (+10 more)

### Community 7 - "dependencies"
Cohesion: 0.09
Nodes (22): dependencies, @base-ui/react, bcryptjs, class-variance-authority, cn, exceljs, @hookform/resolvers, jose (+14 more)

### Community 8 - "tests/actions.ts"
Cohesion: 0.09
Nodes (36): vitest, createQuestion(), deleteQuestion(), deleteTest(), idSchema, importQuestions(), nextOrder(), parseQuestionFile() (+28 more)

### Community 10 - "next"
Cohesion: 0.08
Nodes (41): nextConfig, lucide-react, next, metadata, NotFound(), Error(), metadata, NotFound() (+33 more)

### Community 12 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, eslint, eslint-config-next, eslint-config-prettier

### Community 13 - "Button"
Cohesion: 0.08
Nodes (66): cn, @hookform/resolvers, react, react-hook-form, sonner, setStudentActive(), createTest(), LoginForm() (+58 more)

### Community 14 - "guards.ts"
Cohesion: 0.06
Nodes (52): @base-ui/react, bcryptjs, jose, LoginPage(), metadata, Home(), StudentLayout(), TeacherLayout() (+44 more)

### Community 16 - "groups/actions.ts"
Cohesion: 0.24
Nodes (16): createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), saveSchedule(), createStudent(), groupExists() (+8 more)

### Community 17 - "validators/attendance.ts"
Cohesion: 0.24
Nodes (7): ATTENDANCE_STATUSES, AttendanceFormInput, attendanceFormSchema, ScheduleFormInput, scheduleFormSchema, scheduleRowSchema, timeSchema

### Community 18 - "result/[attemptId]/page.tsx"
Cohesion: 0.07
Nodes (58): DashboardPage(), metadata, loadAttempt(), MARK_STYLES, MarkBanner(), metadata, ResultPage(), Stat() (+50 more)

### Community 20 - "PageSkeleton"
Cohesion: 0.60
Nodes (3): Loading(), Loading(), PageSkeleton()

### Community 21 - "server-only"
Cohesion: 0.28
Nodes (8): exceljs, server-only, parseStudentFile(), validateAgainstDb(), cellValue(), getUploadedFile(), MAX_UPLOAD_BYTES, readFirstSheet()

### Community 22 - "students/actions.ts"
Cohesion: 0.17
Nodes (16): zod, idSchema, ImportPreview, ImportPreviewRow, ImportResult, ActionResult, fullNameSchema, ResetPasswordInput (+8 more)

### Community 23 - "contact.ts"
Cohesion: 0.24
Nodes (11): parseProfile(), EMPTY_PROFILE, normalizePhone(), normalizeTelegram(), optionalPhoneSchema, optionalTelegramSchema, PARENT_RELATIONS, parseParentRelation() (+3 more)

### Community 24 - "students/export/route.ts"
Cohesion: 0.33
Nodes (7): GET(), fileSafe(), buildStudentsWorkbook(), EXPORT_HEADERS, ExportStudent, PARENT_RELATION_LABELS, ParentRelation

### Community 25 - "db"
Cohesion: 0.07
Nodes (35): Biznes qoidalar, GET(), LeaderboardPage(), metadata, one(), metadata, one(), TestLeaderboardPage() (+27 more)

### Community 27 - "students/import.ts"
Cohesion: 0.15
Nodes (16): cellToString(), Column, firstError(), IMPORT_COLUMNS, ImportRow, MAX_IMPORT_ROWS, OPTIONAL_COLUMNS, REQUIRED_COLUMNS (+8 more)

### Community 30 - "results/page.tsx"
Cohesion: 0.09
Nodes (38): GET(), metadata, one(), QuestionSummary(), ScoreLink(), Stat(), MARK_CLASS, MarkBadge() (+30 more)

### Community 31 - "requireTeacher"
Cohesion: 0.15
Nodes (33): GroupsPage(), metadata, metadata, TeacherPage(), importStudents(), previewStudentImport(), withoutPasswords(), ContactLine() (+25 more)

### Community 32 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

## Knowledge Gaps
- **248 isolated node(s):** `Lokal o'rnatish`, `Muhit o'zgaruvchilari`, `Buyruqlar`, `1. Neon bazasi`, `2. Kodni GitHub'ga joylash` (+243 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 303 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `app/layout.tsx`, `package.json`, `time.ts`, `tests/actions.ts`, `Button`, `guards.ts`, `groups/actions.ts`, `result/[attemptId]/page.tsx`, `students/actions.ts`, `students/export/route.ts`, `db`, `results/page.tsx`, `requireTeacher`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `time.ts`, `Bosqichlar`, `tests/actions.ts`, `next`, `Button`, `guards.ts`, `groups/actions.ts`, `students/actions.ts`, `results/page.tsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `next` to `app/layout.tsx`, `package.json`, `time.ts`, `Button`, `guards.ts`, `result/[attemptId]/page.tsx`, `results/page.tsx`, `requireTeacher`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Lokal o'rnatish`, `Muhit o'zgaruvchilari`, `Buyruqlar` to the rest of the system?**
  _248 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._