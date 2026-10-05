# Graph Report - quiz-platform  (2026-10-05)

## Corpus Check
- 161 files · ~45,533 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 851 nodes · 2716 edges · 32 communities (26 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd1f2970`
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
- test-runner.tsx
- Button
- auth/actions.ts
- .prettierrc.json
- importStudents
- tests/actions.ts
- next
- dotenv
- students/actions.ts
- guards.ts
- students/import.ts
- students/import.test.ts
- buttonVariants
- Test platformasi: loyiha qoidalari
- groups/actions.ts
- requireTeacher
- results/page.tsx
- students/export/route.ts

## God Nodes (most connected - your core abstractions)
1. `Button()` - 59 edges
2. `requireTeacher()` - 58 edges
3. `next` - 52 edges
4. `react` - 37 edges
5. `db` - 35 edges
6. `Input()` - 34 edges
7. `lucide-react` - 33 edges
8. `Badge()` - 30 edges
9. `TestResultsPage()` - 23 edges
10. `applyServerErrors()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `7-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `Majburiy qoidalar` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Majburiy qoidalar` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (32 total, 6 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.08
Nodes (25): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+17 more)

### Community 2 - "time.ts"
Cohesion: 0.08
Nodes (57): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SCHEDULES, SeedQuestion, GET() (+49 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+9 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.11
Nodes (18): 1-bosqich: loyiha asosi, 2-bosqich: autentifikatsiya, 3-bosqich: o'qituvchi, guruhlar va o'quvchilar, 4-bosqich: dars jadvali va davomat, 5-bosqich: testlar va savollar, 6-bosqich: test ishlash, 7-bosqich: reyting, 8-bosqich: o'qituvchi statistikasi (+10 more)

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
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 12 - "test-runner.tsx"
Cohesion: 0.15
Nodes (25): saveAnswer(), submitAttempt(), ConfirmAction(), StartTestButton(), start(), RunnerQuestion, SaveIndicator(), TestRunner() (+17 more)

### Community 13 - "Button"
Cohesion: 0.08
Nodes (64): @base-ui/react, cn, @hookform/resolvers, lucide-react, react, react-hook-form, sonner, createQuestion() (+56 more)

### Community 14 - "auth/actions.ts"
Cohesion: 0.06
Nodes (51): bcryptjs, jose, GET(), LoginPage(), metadata, Home(), StudentLayout(), TeacherLayout() (+43 more)

### Community 16 - "importStudents"
Cohesion: 0.23
Nodes (11): importStudents(), parseStudentFile(), previewStudentImport(), withoutPasswords(), onFile(), onImport(), toFormData(), cellValue() (+3 more)

### Community 17 - "tests/actions.ts"
Cohesion: 0.07
Nodes (39): vitest, cancelStudentAttempt(), idSchema, importQuestions(), nextOrder(), parseQuestionFile(), previewQuestionImport(), QuestionImportPreview (+31 more)

### Community 18 - "next"
Cohesion: 0.15
Nodes (18): nextConfig, next, LeaderboardPage(), metadata, one(), metadata, one(), TestLeaderboardPage() (+10 more)

### Community 20 - "students/actions.ts"
Cohesion: 0.18
Nodes (15): idSchema, ImportPreview, ImportPreviewRow, ImportResult, fullNameSchema, passwordSchema, ResetPasswordInput, resetPasswordSchema (+7 more)

### Community 21 - "guards.ts"
Cohesion: 0.05
Nodes (63): server-only, DashboardPage(), metadata, loadAttempt(), MARK_STYLES, MarkBanner(), metadata, ResultPage() (+55 more)

### Community 22 - "students/import.ts"
Cohesion: 0.14
Nodes (21): validateAgainstDb(), Column, firstError(), IMPORT_COLUMNS, OPTIONAL_COLUMNS, parseProfile(), REQUIRED_COLUMNS, ValidatedRow (+13 more)

### Community 23 - "students/import.test.ts"
Cohesion: 0.25
Nodes (7): cellToString(), ImportRow, MAX_IMPORT_ROWS, sheetToRows(), EMPTY_CONTACT, HEADER, rowsOf()

### Community 24 - "buttonVariants"
Cohesion: 0.20
Nodes (13): GroupPage(), metadata, deleteTest(), moveQuestion(), setTestActive(), EditTestPage(), metadata, ScheduleForm() (+5 more)

### Community 25 - "Test platformasi: loyiha qoidalari"
Cohesion: 0.22
Nodes (8): Buyruqlar, graphify, Ish tartibi, Majburiy qoidalar, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari

### Community 26 - "groups/actions.ts"
Cohesion: 0.14
Nodes (18): zod, createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), ActionResult, isNotFound() (+10 more)

### Community 27 - "requireTeacher"
Cohesion: 0.23
Nodes (14): saveSchedule(), metadata, TeacherPage(), createStudent(), groupExists(), resetStudentPassword(), revalidate(), setStudentActive() (+6 more)

### Community 30 - "results/page.tsx"
Cohesion: 0.07
Nodes (61): GET(), GroupsPage(), metadata, ContactLine(), metadata, StudentCardPage(), ImportStudentsPage(), metadata (+53 more)

### Community 32 - "students/export/route.ts"
Cohesion: 0.30
Nodes (8): exceljs, GET(), fileSafe(), buildStudentsWorkbook(), EXPORT_HEADERS, ExportStudent, PARENT_RELATION_LABELS, ParentRelation

## Knowledge Gaps
- **228 isolated node(s):** `metadata`, `MARK_CLASS`, `StatAnswer`, `STATUS_LABEL`, `SheetStudent` (+223 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 283 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `students/export/route.ts`, `package.json`, `time.ts`, `app/layout.tsx`, `Button`, `auth/actions.ts`, `tests/actions.ts`, `students/actions.ts`, `guards.ts`, `buttonVariants`, `groups/actions.ts`, `requireTeacher`, `results/page.tsx`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `time.ts`, `Bosqichlar`, `Button`, `importStudents`, `tests/actions.ts`, `next`, `students/actions.ts`, `guards.ts`, `buttonVariants`, `Test platformasi: loyiha qoidalari`, `groups/actions.ts`, `results/page.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Button` to `package.json`, `time.ts`, `app/layout.tsx`, `test-runner.tsx`, `auth/actions.ts`, `next`, `guards.ts`, `buttonVariants`, `results/page.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `MARK_CLASS`, `StatAnswer` to the rest of the system?**
  _228 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07977207977207977 - nodes in this community are weakly interconnected._