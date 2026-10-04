# Graph Report - quiz-platform  (2026-10-04)

## Corpus Check
- 105 files · ~24,735 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 577 nodes · 1650 edges · 18 communities (15 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b647e6c4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- package.json
- students/actions.ts
- devDependencies
- Bosqichlar
- components.json
- dependencies
- README.md
- AGENTS.md
- Button
- postcss.config.mjs
- student-dialog.tsx
- guards.ts
- .prettierrc.json
- requireTeacher
- tests/actions.ts
- lucide-react
- [attemptId]/page.tsx

## God Nodes (most connected - your core abstractions)
1. `Button()` - 50 edges
2. `requireTeacher()` - 39 edges
3. `react` - 34 edges
4. `next` - 30 edges
5. `lucide-react` - 23 edges
6. `Input()` - 23 edges
7. `ConfirmAction()` - 18 edges
8. `TestRunner()` - 18 edges
9. `ImportStudents()` - 18 edges
10. `Badge()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `6-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `Xavfsizlik invariantlari (buzilmasin)` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Xavfsizlik invariantlari (buzilmasin)` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (18 total, 3 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (42): eslintConfig, name, packageManager, private, scripts, build, db:deploy, db:generate (+34 more)

### Community 2 - "students/actions.ts"
Cohesion: 0.10
Nodes (34): createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), createStudent(), formFields(), groupExists() (+26 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+9 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.12
Nodes (15): 1-bosqich: loyiha asosi, 2-bosqich: autentifikatsiya, 3-bosqich: o'qituvchi, guruhlar va o'quvchilar, 4-bosqich: testlar va savollar, 5-bosqich: test ishlash, 6-bosqich: reyting, 7-bosqich: o'qituvchi statistikasi, 8-bosqich: sayqal va deploy (+7 more)

### Community 5 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @base-ui/react, bcryptjs, class-variance-authority, cn, jose, lucide-react, next (+12 more)

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 10 - "Button"
Cohesion: 0.12
Nodes (30): @base-ui/react, sonner, deleteTest(), moveQuestion(), setTestActive(), EditTestPage(), metadata, ConfirmAction() (+22 more)

### Community 13 - "student-dialog.tsx"
Cohesion: 0.08
Nodes (52): cn, react, createTest(), updateTestSettings(), FormError(), FormField(), fieldError(), FormAction (+44 more)

### Community 14 - "guards.ts"
Cohesion: 0.06
Nodes (54): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SeedQuestion, bcryptjs, jose (+46 more)

### Community 16 - "requireTeacher"
Cohesion: 0.16
Nodes (28): nextConfig, next, GroupsPage(), metadata, metadata, TeacherPage(), importStudents(), previewStudentImport() (+20 more)

### Community 17 - "tests/actions.ts"
Cohesion: 0.08
Nodes (35): read-excel-file, vitest, zod, createQuestion(), createTestSchema, deleteQuestion(), idSchema, importQuestions() (+27 more)

### Community 18 - "lucide-react"
Cohesion: 0.13
Nodes (17): lucide-react, next-themes, geistMono, geistSans, metadata, RootLayout(), MobileNav(), LINKS (+9 more)

### Community 21 - "[attemptId]/page.tsx"
Cohesion: 0.07
Nodes (47): graphify, Ish tartibi, Quiz platform, Skill va agentlar (qachon nima), Stek, Xavfsizlik invariantlari (buzilmasin), DashboardPage(), metadata (+39 more)

## Knowledge Gaps
- **177 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+172 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 218 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `requireTeacher` to `package.json`, `students/actions.ts`, `Button`, `student-dialog.tsx`, `guards.ts`, `tests/actions.ts`, `lucide-react`, `[attemptId]/page.tsx`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `react` connect `student-dialog.tsx` to `package.json`, `Button`, `guards.ts`, `requireTeacher`, `tests/actions.ts`, `lucide-react`, `[attemptId]/page.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `students/actions.ts`, `Bosqichlar`, `Button`, `student-dialog.tsx`, `guards.ts`, `tests/actions.ts`, `[attemptId]/page.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Xavfsizlik invariantlari (buzilmasin)` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _177 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.047474747474747475 - nodes in this community are weakly interconnected._