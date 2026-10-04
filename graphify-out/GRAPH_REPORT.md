# Graph Report - quiz-platform  (2026-10-04)

## Corpus Check
- 39 files · ~6,648 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 257 nodes · 388 edges · 16 communities (13 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fbabaaf5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- package.json
- layout.tsx
- devDependencies
- Bosqichlar
- components.json
- scripts
- dependencies
- README.md
- AGENTS.md
- guards.ts
- postcss.config.mjs
- actions.ts
- login/page.tsx
- jwt.ts
- .prettierrc.json

## God Nodes (most connected - your core abstractions)
1. `scripts` - 16 edges
2. `compilerOptions` - 16 edges
3. `next` - 11 edges
4. `login()` - 10 edges
5. `homePathFor()` - 10 edges
6. `LoginPage()` - 9 edges
7. `Bosqichlar` - 9 edges
8. `LoginForm()` - 7 edges
9. `decodeSession()` - 7 edges
10. `Test platformasi: ish rejasi` - 7 edges

## Surprising Connections (you probably didn't know these)
- `2-bosqich: autentifikatsiya` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Xavfsizlik invariantlari (buzilmasin)` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `Xavfsizlik invariantlari (buzilmasin)` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `main()` --calls--> `hashPassword()`  [EXTRACTED]
  prisma/seed.ts → src/lib/auth/password.ts

## Import Cycles
- None detected.

## Communities (16 total, 3 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.07
Nodes (27): eslintConfig, name, packageManager, private, version, dotenv, eslint, eslint-config-next (+19 more)

### Community 2 - "layout.tsx"
Cohesion: 0.33
Nodes (3): geistMono, geistSans, metadata

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
Cohesion: 0.12
Nodes (16): dependencies, @base-ui/react, bcryptjs, class-variance-authority, cn, jose, lucide-react, next (+8 more)

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 10 - "guards.ts"
Cohesion: 0.13
Nodes (20): graphify, Ish tartibi, Quiz platform, Skill va agentlar (qachon nima), Stek, Xavfsizlik invariantlari (buzilmasin), nextConfig, next (+12 more)

### Community 12 - "actions.ts"
Cohesion: 0.11
Nodes (24): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SeedQuestion, bcryptjs, @prisma/adapter-pg (+16 more)

### Community 13 - "login/page.tsx"
Cohesion: 0.15
Nodes (17): @base-ui/react, class-variance-authority, cn, react, LoginPage(), metadata, LoginForm(), Button() (+9 more)

### Community 14 - "jwt.ts"
Cohesion: 0.28
Nodes (12): jose, decodeSession(), encodeSession(), getKey(), homePathFor(), Role, SESSION_COOKIE, SESSION_MAX_AGE_SEC (+4 more)

## Knowledge Gaps
- **142 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+137 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 155 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `guards.ts` to `package.json`, `layout.tsx`, `actions.ts`, `login/page.tsx`, `jwt.ts`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _142 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06854838709677419 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._