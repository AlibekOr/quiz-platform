# Graph Report - quiz-platform  (2026-10-04)

## Corpus Check
- 90 files · ~20,109 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 518 nodes · 1416 edges · 25 communities (21 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a1d591b0`
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
- Button
- postcss.config.mjs
- seed.ts
- student-dialog.tsx
- guards.ts
- .prettierrc.json
- students/page.tsx
- tests/actions.ts
- sheet.tsx
- student-row-actions.tsx
- app/layout.tsx
- Quiz platform
- password.ts
- eslint.config.mjs
- dotenv

## God Nodes (most connected - your core abstractions)
1. `Button()` - 46 edges
2. `requireTeacher()` - 39 edges
3. `react` - 30 edges
4. `next` - 26 edges
5. `Input()` - 23 edges
6. `lucide-react` - 21 edges
7. `ConfirmAction()` - 18 edges
8. `ImportStudents()` - 18 edges
9. `scripts` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Xavfsizlik invariantlari (buzilmasin)` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Xavfsizlik invariantlari (buzilmasin)` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `main()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/seed.ts → src/lib/auth/password.ts

## Import Cycles
- None detected.

## Communities (25 total, 4 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (21): name, packageManager, private, version, class-variance-authority, pg, prettier, prettier-plugin-tailwindcss (+13 more)

### Community 2 - "students/actions.ts"
Cohesion: 0.08
Nodes (46): zod, createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), metadata, TeacherPage() (+38 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+9 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.12
Nodes (15): 1-bosqich: loyiha asosi, 2-bosqich: autentifikatsiya, 3-bosqich: o'qituvchi, guruhlar va o'quvchilar, 4-bosqich: testlar va savollar, 5-bosqich: test ishlash, 6-bosqich: reyting, 7-bosqich: o'qituvchi statistikasi, 8-bosqich: sayqal va deploy (+7 more)

### Community 5 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:studio, dev (+8 more)

### Community 7 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @base-ui/react, bcryptjs, class-variance-authority, cn, jose, lucide-react, next (+12 more)

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 10 - "Button"
Cohesion: 0.14
Nodes (21): @base-ui/react, sonner, EditTestPage(), metadata, ConfirmAction(), QuestionList(), TestHeaderActions(), TestSettingsForm() (+13 more)

### Community 12 - "seed.ts"
Cohesion: 0.20
Nodes (7): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SeedQuestion, @prisma/adapter-pg

### Community 13 - "student-dialog.tsx"
Cohesion: 0.12
Nodes (43): cn, lucide-react, react, createTest(), FormError(), FormField(), fieldError(), FormAction (+35 more)

### Community 14 - "guards.ts"
Cohesion: 0.07
Nodes (44): nextConfig, jose, next, server-only, DashboardPage(), metadata, LoginPage(), metadata (+36 more)

### Community 16 - "students/page.tsx"
Cohesion: 0.21
Nodes (21): GroupsPage(), metadata, previewStudentImport(), ImportStudentsPage(), metadata, metadata, param(), StudentsPage() (+13 more)

### Community 17 - "tests/actions.ts"
Cohesion: 0.10
Nodes (33): vitest, createQuestion(), createTestSchema, deleteQuestion(), idSchema, importQuestions(), moveQuestion(), nextOrder() (+25 more)

### Community 18 - "sheet.tsx"
Cohesion: 0.18
Nodes (13): TeacherLayout(), MobileNav(), LINKS, NavLinks(), Sheet(), SheetContent(), SheetHeader(), SheetOverlay() (+5 more)

### Community 19 - "student-row-actions.tsx"
Cohesion: 0.18
Nodes (9): setStudentActive(), GroupRowActions(), StudentRowActions(), DropdownMenu(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuSeparator(), DropdownMenuSubContent() (+1 more)

### Community 20 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 21 - "Quiz platform"
Cohesion: 0.29
Nodes (6): graphify, Ish tartibi, Quiz platform, Skill va agentlar (qachon nima), Stek, Xavfsizlik invariantlari (buzilmasin)

### Community 22 - "password.ts"
Cohesion: 0.53
Nodes (4): bcryptjs, hashPassword(), verifyAgainstDummy(), verifyPassword()

### Community 23 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, eslint, eslint-config-next, eslint-config-prettier

## Knowledge Gaps
- **169 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 208 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `guards.ts` to `package.json`, `students/actions.ts`, `Button`, `student-dialog.tsx`, `students/page.tsx`, `tests/actions.ts`, `sheet.tsx`, `app/layout.tsx`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `students/actions.ts` to `Bosqichlar`, `Button`, `student-dialog.tsx`, `guards.ts`, `students/page.tsx`, `tests/actions.ts`, `student-row-actions.tsx`, `Quiz platform`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `react` connect `student-dialog.tsx` to `package.json`, `Button`, `guards.ts`, `students/page.tsx`, `tests/actions.ts`, `sheet.tsx`, `student-row-actions.tsx`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Xavfsizlik invariantlari (buzilmasin)` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._