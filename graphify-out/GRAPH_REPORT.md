# Graph Report - quiz-platform  (2026-10-04)

## Corpus Check
- 135 files · ~36,636 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 730 nodes · 2303 edges · 28 communities (24 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `830197d2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- package.json
- next
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
- students/[id]/page.tsx
- tests/actions.ts
- guards.ts
- dotenv
- test-runner.tsx
- db.ts
- test.ts
- students/actions.ts
- requireTeacher
- ImportQuestions
- groups/actions.ts
- revalidateTest

## God Nodes (most connected - your core abstractions)
1. `Button()` - 57 edges
2. `requireTeacher()` - 53 edges
3. `next` - 42 edges
4. `react` - 36 edges
5. `Input()` - 34 edges
6. `lucide-react` - 30 edges
7. `db` - 26 edges
8. `Badge()` - 24 edges
9. `applyServerErrors()` - 22 edges
10. `FormError()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `7-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `Majburiy qoidalar` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Majburiy qoidalar` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (28 total, 4 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (21): name, packageManager, private, version, class-variance-authority, next-themes, pg, prettier (+13 more)

### Community 2 - "next"
Cohesion: 0.07
Nodes (60): nextConfig, CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SCHEDULES, SeedQuestion (+52 more)

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
Nodes (62): @hookform/resolvers, lucide-react, react, react-hook-form, sonner, setStudentActive(), LoginForm(), applyServerErrors() (+54 more)

### Community 14 - "auth/actions.ts"
Cohesion: 0.08
Nodes (37): bcryptjs, jose, LoginPage(), metadata, Home(), Card(), CardContent(), CardDescription() (+29 more)

### Community 16 - "students/[id]/page.tsx"
Cohesion: 0.15
Nodes (32): GroupsPage(), metadata, importStudents(), parseStudentFile(), previewStudentImport(), withoutPasswords(), ContactLine(), metadata (+24 more)

### Community 17 - "tests/actions.ts"
Cohesion: 0.14
Nodes (19): createQuestion(), idSchema, importQuestions(), nextOrder(), parseQuestionFile(), QuestionImportPreview, cellValue(), getUploadedFile() (+11 more)

### Community 18 - "guards.ts"
Cohesion: 0.11
Nodes (23): exceljs, GET(), StudentLayout(), TeacherLayout(), LogoutButton(), MobileNav(), LINKS, NavLinks() (+15 more)

### Community 20 - "test-runner.tsx"
Cohesion: 0.10
Nodes (31): @base-ui/react, cn, saveAnswer(), submitAttempt(), EditTestPage(), metadata, ConfirmAction(), StartTestButton() (+23 more)

### Community 21 - "db.ts"
Cohesion: 0.07
Nodes (48): Buyruqlar, graphify, Ish tartibi, Majburiy qoidalar, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari (+40 more)

### Community 22 - "test.ts"
Cohesion: 0.17
Nodes (13): updateTestSettings(), CreateTestInput, createTestSchema, issueMessages(), MAX_OPTIONS, optionInputSchema, QuestionFormInput, questionFormSchema (+5 more)

### Community 23 - "students/actions.ts"
Cohesion: 0.07
Nodes (44): idSchema, ImportPreview, ImportPreviewRow, ImportResult, validateAgainstDb(), cellToString(), Column, firstError() (+36 more)

### Community 24 - "requireTeacher"
Cohesion: 0.18
Nodes (19): createGroup(), deleteGroup(), renameGroup(), revalidate(), saveSchedule(), metadata, TeacherPage(), createStudent() (+11 more)

### Community 25 - "ImportQuestions"
Cohesion: 0.39
Nodes (7): previewQuestionImport(), ImportQuestionsPage(), metadata, ImportQuestions(), onFile(), onImport(), toFormData()

### Community 26 - "groups/actions.ts"
Cohesion: 0.18
Nodes (9): vitest, idSchema, ATTENDANCE_STATUSES, AttendanceFormInput, attendanceFormSchema, ScheduleFormInput, scheduleFormSchema, scheduleRowSchema (+1 more)

### Community 27 - "revalidateTest"
Cohesion: 0.29
Nodes (7): deleteQuestion(), moveQuestion(), revalidateTest(), setTestActive(), updateQuestion(), move(), toggleActive()

## Knowledge Gaps
- **208 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+203 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 251 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `app/layout.tsx`, `Button`, `auth/actions.ts`, `students/[id]/page.tsx`, `tests/actions.ts`, `guards.ts`, `test-runner.tsx`, `db.ts`, `students/actions.ts`, `requireTeacher`, `ImportQuestions`, `groups/actions.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `next`, `Bosqichlar`, `Button`, `auth/actions.ts`, `students/[id]/page.tsx`, `tests/actions.ts`, `guards.ts`, `test-runner.tsx`, `db.ts`, `test.ts`, `students/actions.ts`, `ImportQuestions`, `groups/actions.ts`, `revalidateTest`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `react` connect `Button` to `package.json`, `auth/actions.ts`, `students/[id]/page.tsx`, `guards.ts`, `test-runner.tsx`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _208 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._