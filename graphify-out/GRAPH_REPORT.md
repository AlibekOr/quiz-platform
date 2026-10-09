# Graph Report - quiz-platform  (2026-10-09)

## Corpus Check
- 188 files · ~54,141 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 952 nodes · 3166 edges · 29 communities (22 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f886d40`
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
- next
- postcss.config.mjs
- students/import.ts
- Button
- account/actions.ts
- .prettierrc.json
- students/actions.ts
- requireTeacher
- result/[attemptId]/page.tsx
- dotenv
- PageSkeleton
- students/import.test.ts
- groups/actions.ts
- guards.ts
- results/page.tsx
- tests/actions.ts

## God Nodes (most connected - your core abstractions)
1. `Button()` - 73 edges
2. `requireTeacher()` - 68 edges
3. `next` - 61 edges
4. `react` - 43 edges
5. `lucide-react` - 42 edges
6. `Input()` - 40 edges
7. `db` - 37 edges
8. `Badge()` - 32 edges
9. `applyServerErrors()` - 28 edges
10. `FormError()` - 28 edges

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

## Communities (29 total, 7 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.08
Nodes (24): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+16 more)

### Community 2 - "time.ts"
Cohesion: 0.06
Nodes (77): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SCHEDULES, SeedQuestion, TEACHER_ONLY (+69 more)

### Community 3 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+10 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.05
Nodes (38): Buyruqlar, graphify, Ish tartibi, Majburiy qoidalar, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari (+30 more)

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

### Community 10 - "next"
Cohesion: 0.11
Nodes (22): nextConfig, next, next-themes, geistMono, geistSans, metadata, RootLayout(), metadata (+14 more)

### Community 12 - "students/import.ts"
Cohesion: 0.11
Nodes (24): EXPORT_HEADERS, ExportStudent, Column, firstError(), IMPORT_COLUMNS, OPTIONAL_COLUMNS, parseProfile(), REQUIRED_COLUMNS (+16 more)

### Community 13 - "Button"
Cohesion: 0.07
Nodes (79): @base-ui/react, cn, @hookform/resolvers, lucide-react, react, react-hook-form, sonner, AccountPage() (+71 more)

### Community 14 - "account/actions.ts"
Cohesion: 0.08
Nodes (43): bcryptjs, jose, LoginPage(), metadata, StudentLayout(), changeOwnPassword(), updateOwnProfile(), LogoutButton() (+35 more)

### Community 16 - "students/actions.ts"
Cohesion: 0.13
Nodes (21): idSchema, ImportPreview, ImportPreviewRow, ImportResult, parseStudentFile(), previewStudentImport(), validateAgainstDb(), withoutPasswords() (+13 more)

### Community 17 - "requireTeacher"
Cohesion: 0.24
Nodes (16): 11-bosqich: boshqa guruhga o'tkazish, createStudent(), deleteStudent(), groupExists(), importStudents(), removeStudentFromGroup(), resetStudentPassword(), revalidate() (+8 more)

### Community 18 - "result/[attemptId]/page.tsx"
Cohesion: 0.06
Nodes (67): DashboardPage(), metadata, loadAttempt(), MARK_STYLES, MarkBanner(), metadata, ResultPage(), Stat() (+59 more)

### Community 20 - "PageSkeleton"
Cohesion: 0.60
Nodes (3): Loading(), Loading(), PageSkeleton()

### Community 21 - "students/import.test.ts"
Cohesion: 0.25
Nodes (7): cellToString(), ImportRow, MAX_IMPORT_ROWS, sheetToRows(), EMPTY_CONTACT, HEADER, rowsOf()

### Community 22 - "groups/actions.ts"
Cohesion: 0.13
Nodes (22): zod, idSchema, createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), saveSchedule() (+14 more)

### Community 25 - "guards.ts"
Cohesion: 0.06
Nodes (49): server-only, GET(), GET(), GET(), Home(), LeaderboardPage(), metadata, one() (+41 more)

### Community 31 - "results/page.tsx"
Cohesion: 0.07
Nodes (63): GroupsPage(), metadata, ContactLine(), metadata, StudentCardPage(), ImportStudentsPage(), metadata, metadata (+55 more)

### Community 33 - "tests/actions.ts"
Cohesion: 0.07
Nodes (52): vitest, createQuestion(), deleteQuestion(), deleteTest(), idSchema, importQuestions(), moveQuestion(), nextOrder() (+44 more)

## Knowledge Gaps
- **252 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+247 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 310 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `time.ts`, `tests/actions.ts`, `sheet.tsx`, `Button`, `account/actions.ts`, `students/actions.ts`, `result/[attemptId]/page.tsx`, `groups/actions.ts`, `guards.ts`, `results/page.tsx`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `tests/actions.ts`, `time.ts`, `Bosqichlar`, `next`, `Button`, `account/actions.ts`, `students/actions.ts`, `result/[attemptId]/page.tsx`, `groups/actions.ts`, `guards.ts`, `results/page.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Button` to `package.json`, `time.ts`, `tests/actions.ts`, `sheet.tsx`, `next`, `result/[attemptId]/page.tsx`, `guards.ts`, `results/page.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `11-bosqich: boshqa guruhga o'tkazish`) actually correct?**
  _`requireTeacher()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _252 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08307692307692308 - nodes in this community are weakly interconnected._