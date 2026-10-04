# Graph Report - quiz-platform  (2026-10-04)

## Corpus Check
- 74 files · ~14,235 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 441 nodes · 1054 edges · 18 communities (15 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `17d46a36`
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
- guards.ts
- postcss.config.mjs
- auth/actions.ts
- student-dialog.tsx
- login/page.tsx
- .prettierrc.json
- students/page.tsx
- alert-dialog.tsx

## God Nodes (most connected - your core abstractions)
1. `Button()` - 33 edges
2. `react` - 23 edges
3. `requireTeacher()` - 23 edges
4. `next` - 19 edges
5. `ImportStudents()` - 18 edges
6. `scripts` - 16 edges
7. `compilerOptions` - 16 edges
8. `lucide-react` - 15 edges
9. `GroupRowActions()` - 15 edges
10. `Input()` - 15 edges

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

## Communities (18 total, 3 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.05
Nodes (35): eslintConfig, name, packageManager, private, version, class-variance-authority, dotenv, eslint (+27 more)

### Community 2 - "students/actions.ts"
Cohesion: 0.09
Nodes (42): zod, createGroup(), deleteGroup(), idSchema, renameGroup(), revalidate(), createStudent(), formFields() (+34 more)

### Community 3 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+9 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.13
Nodes (14): 1-bosqich: loyiha asosi, 3-bosqich: o'qituvchi, guruhlar va o'quvchilar, 4-bosqich: testlar va savollar, 5-bosqich: test ishlash, 6-bosqich: reyting, 7-bosqich: o'qituvchi statistikasi, 8-bosqich: sayqal va deploy, Biznes qoidalar (+6 more)

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

### Community 10 - "guards.ts"
Cohesion: 0.08
Nodes (31): graphify, Ish tartibi, Quiz platform, Skill va agentlar (qachon nima), Stek, Xavfsizlik invariantlari (buzilmasin), nextConfig, 2-bosqich: autentifikatsiya (+23 more)

### Community 12 - "auth/actions.ts"
Cohesion: 0.10
Nodes (24): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SeedQuestion, bcryptjs, @prisma/adapter-pg (+16 more)

### Community 13 - "student-dialog.tsx"
Cohesion: 0.09
Nodes (44): @base-ui/react, cn, lucide-react, react, LoginForm(), FormError(), FormField(), fieldError() (+36 more)

### Community 14 - "login/page.tsx"
Cohesion: 0.16
Nodes (19): jose, LoginPage(), metadata, Card(), CardContent(), CardDescription(), CardHeader(), CardTitle() (+11 more)

### Community 16 - "students/page.tsx"
Cohesion: 0.20
Nodes (20): GroupsPage(), metadata, previewStudentImport(), ImportStudentsPage(), metadata, metadata, param(), StudentsPage() (+12 more)

### Community 17 - "alert-dialog.tsx"
Cohesion: 0.26
Nodes (11): ConfirmAction(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter(), AlertDialogHeader() (+3 more)

## Knowledge Gaps
- **160 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+155 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 194 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `guards.ts` to `package.json`, `students/actions.ts`, `auth/actions.ts`, `student-dialog.tsx`, `login/page.tsx`, `students/page.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Why does `react` connect `student-dialog.tsx` to `package.json`, `guards.ts`, `login/page.tsx`, `students/page.tsx`, `alert-dialog.tsx`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `students/actions.ts` to `students/page.tsx`, `guards.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `requireTeacher()` (e.g. with `Xavfsizlik invariantlari (buzilmasin)` and `2-bosqich: autentifikatsiya`) actually correct?**
  _`requireTeacher()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _160 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.053156146179401995 - nodes in this community are weakly interconnected._