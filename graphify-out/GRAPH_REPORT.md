# Graph Report - quiz-platform  (2026-10-04)

## Corpus Check
- 105 files · ~25,690 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 580 nodes · 1653 edges · 21 communities (17 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `755b825d`
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
- test-runner.tsx

## God Nodes (most connected - your core abstractions)
1. `Button()` - 50 edges
2. `requireTeacher()` - 39 edges
3. `react` - 34 edges
4. `next` - 30 edges
5. `Input()` - 23 edges
6. `lucide-react` - 23 edges
7. `ConfirmAction()` - 18 edges
8. `TestRunner()` - 18 edges
9. `ImportStudents()` - 18 edges
10. `Badge()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `7-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `Majburiy qoidalar` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `Majburiy qoidalar` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (21 total, 4 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.09
Nodes (21): name, packageManager, private, version, bcryptjs, class-variance-authority, pg, prettier (+13 more)

### Community 2 - "students/actions.ts"
Cohesion: 0.10
Nodes (35): createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), createStudent(), formFields(), groupExists() (+27 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+9 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.07
Nodes (24): Buyruqlar, graphify, Ish tartibi, Majburiy qoidalar, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari (+16 more)

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

### Community 10 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 12 - "eslint.config.mjs"
Cohesion: 0.40
Nodes (4): eslintConfig, eslint, eslint-config-next, eslint-config-prettier

### Community 13 - "Button"
Cohesion: 0.08
Nodes (58): @base-ui/react, cn, lucide-react, react, createTest(), updateTestSettings(), LoginForm(), FormError() (+50 more)

### Community 14 - "auth/actions.ts"
Cohesion: 0.08
Nodes (36): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SeedQuestion, jose, @prisma/adapter-pg (+28 more)

### Community 16 - "requireTeacher"
Cohesion: 0.10
Nodes (41): nextConfig, next, server-only, GroupsPage(), metadata, metadata, TeacherPage(), importStudents() (+33 more)

### Community 17 - "tests/actions.ts"
Cohesion: 0.10
Nodes (34): read-excel-file, zod, createQuestion(), createTestSchema, deleteTest(), idSchema, importQuestions(), nextOrder() (+26 more)

### Community 18 - "sheet.tsx"
Cohesion: 0.11
Nodes (22): LoginPage(), metadata, StudentLayout(), TeacherLayout(), LogoutButton(), MobileNav(), LINKS, NavLinks() (+14 more)

### Community 21 - "test-runner.tsx"
Cohesion: 0.07
Nodes (58): sonner, DashboardPage(), metadata, loadAttempt(), metadata, ResultPage(), Stat(), idSchema (+50 more)

## Knowledge Gaps
- **180 isolated node(s):** `Stack (o'zgartirma, avval so'ra)`, `Papka tuzilmasi`, `Ish tartibi`, `Buyruqlar`, `Next.js 16` (+175 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 221 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `requireTeacher` to `package.json`, `students/actions.ts`, `app/layout.tsx`, `Button`, `auth/actions.ts`, `tests/actions.ts`, `sheet.tsx`, `test-runner.tsx`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `react` connect `Button` to `package.json`, `requireTeacher`, `tests/actions.ts`, `sheet.tsx`, `test-runner.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `students/actions.ts`, `Bosqichlar`, `Button`, `auth/actions.ts`, `tests/actions.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Stack (o'zgartirma, avval so'ra)`, `Papka tuzilmasi`, `Ish tartibi` to the rest of the system?**
  _180 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._