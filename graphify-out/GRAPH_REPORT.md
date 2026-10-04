# Graph Report - quiz-platform  (2026-10-04)

## Corpus Check
- 118 files · ~29,834 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 645 nodes · 1919 edges · 27 communities (23 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4bfa4e04`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- package.json
- students/actions.ts
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
- sheet.tsx
- dotenv
- button.tsx
- [attemptId]/page.tsx
- Test platformasi: loyiha qoidalari
- students/import.ts
- groups/actions.ts
- export.ts
- vitest

## God Nodes (most connected - your core abstractions)
1. `Button()` - 51 edges
2. `requireTeacher()` - 42 edges
3. `react` - 33 edges
4. `next` - 32 edges
5. `Input()` - 26 edges
6. `lucide-react` - 24 edges
7. `Badge()` - 20 edges
8. `db` - 20 edges
9. `ConfirmAction()` - 18 edges
10. `applyServerErrors()` - 18 edges

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

## Communities (27 total, 4 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (21): name, packageManager, private, version, bcryptjs, class-variance-authority, pg, prettier (+13 more)

### Community 2 - "students/actions.ts"
Cohesion: 0.15
Nodes (20): idSchema, ImportPreview, ImportPreviewRow, ImportResult, importStudents(), parseStudentFile(), previewStudentImport(), validateAgainstDb() (+12 more)

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
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 12 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, eslint, eslint-config-next, eslint-config-prettier

### Community 13 - "Button"
Cohesion: 0.10
Nodes (52): @hookform/resolvers, lucide-react, react, react-hook-form, createTest(), LoginForm(), applyServerErrors(), FormError() (+44 more)

### Community 14 - "auth/actions.ts"
Cohesion: 0.07
Nodes (43): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SeedQuestion, jose, @prisma/adapter-pg (+35 more)

### Community 16 - "requireTeacher"
Cohesion: 0.11
Nodes (41): nextConfig, next, server-only, GroupsPage(), metadata, metadata, TeacherPage(), ContactLine() (+33 more)

### Community 17 - "tests/actions.ts"
Cohesion: 0.08
Nodes (41): zod, createQuestion(), deleteQuestion(), idSchema, importQuestions(), moveQuestion(), nextOrder(), parseQuestionFile() (+33 more)

### Community 18 - "sheet.tsx"
Cohesion: 0.18
Nodes (15): StudentLayout(), TeacherLayout(), LogoutButton(), MobileNav(), LINKS, NavLinks(), Sheet(), SheetContent() (+7 more)

### Community 20 - "button.tsx"
Cohesion: 0.12
Nodes (27): @base-ui/react, cn, sonner, deleteTest(), setTestActive(), ConfirmAction(), StartTestButton(), SaveIndicator() (+19 more)

### Community 21 - "[attemptId]/page.tsx"
Cohesion: 0.09
Nodes (40): DashboardPage(), metadata, loadAttempt(), metadata, ResultPage(), Stat(), idSchema, saveAnswer() (+32 more)

### Community 22 - "Test platformasi: loyiha qoidalari"
Cohesion: 0.22
Nodes (8): Buyruqlar, graphify, Ish tartibi, Majburiy qoidalar, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari

### Community 23 - "students/import.ts"
Cohesion: 0.14
Nodes (20): Column, firstError(), IMPORT_COLUMNS, OPTIONAL_COLUMNS, parseProfile(), REQUIRED_COLUMNS, ValidatedRow, validateImportRows() (+12 more)

### Community 24 - "groups/actions.ts"
Cohesion: 0.20
Nodes (17): createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), createStudent(), groupExists(), resetStudentPassword() (+9 more)

### Community 25 - "export.ts"
Cohesion: 0.21
Nodes (11): exceljs, GET(), cellValue(), MAX_UPLOAD_BYTES, readFirstSheet(), buildStudentsWorkbook(), EXPORT_HEADERS, ExportStudent (+3 more)

### Community 26 - "vitest"
Cohesion: 0.18
Nodes (8): vitest, cellToString(), ImportRow, MAX_IMPORT_ROWS, sheetToRows(), EMPTY_CONTACT, HEADER, rowsOf()

## Knowledge Gaps
- **189 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+184 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 230 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `requireTeacher` to `package.json`, `students/actions.ts`, `app/layout.tsx`, `Button`, `auth/actions.ts`, `tests/actions.ts`, `sheet.tsx`, `button.tsx`, `[attemptId]/page.tsx`, `groups/actions.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `students/actions.ts`, `Bosqichlar`, `Button`, `auth/actions.ts`, `tests/actions.ts`, `button.tsx`, `Test platformasi: loyiha qoidalari`, `groups/actions.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `react` connect `Button` to `package.json`, `auth/actions.ts`, `requireTeacher`, `sheet.tsx`, `button.tsx`, `[attemptId]/page.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _189 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._