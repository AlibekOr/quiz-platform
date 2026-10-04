# Graph Report - quiz-platform  (2026-10-04)

## Corpus Check
- 21 files · ~4,698 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 192 nodes · 195 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `df006dc4`
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
- Quiz platform
- postcss.config.mjs
- seed.ts
- button.tsx
- vitest
- .prettierrc.json

## God Nodes (most connected - your core abstractions)
1. `scripts` - 16 edges
2. `compilerOptions` - 16 edges
3. `Bosqichlar` - 9 edges
4. `Test platformasi: ish rejasi` - 7 edges
5. `tailwind` - 6 edges
6. `aliases` - 6 edges
7. `Quiz platform` - 6 edges
8. `next` - 4 edges
9. `@prisma/adapter-pg` - 3 edges
10. `cn` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.07
Nodes (28): eslintConfig, name, packageManager, private, version, dotenv, eslint, eslint-config-next (+20 more)

### Community 2 - "layout.tsx"
Cohesion: 0.18
Nodes (5): nextConfig, next, geistMono, geistSans, metadata

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

### Community 10 - "Quiz platform"
Cohesion: 0.29
Nodes (6): graphify, Ish tartibi, Quiz platform, Skill va agentlar (qachon nima), Stek, Xavfsizlik invariantlari (buzilmasin)

### Community 12 - "seed.ts"
Cohesion: 0.14
Nodes (11): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SeedQuestion, bcryptjs, @prisma/adapter-pg (+3 more)

### Community 13 - "button.tsx"
Cohesion: 0.33
Nodes (5): @base-ui/react, class-variance-authority, cn, Button(), buttonVariants

## Knowledge Gaps
- **139 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+134 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 151 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _139 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07096774193548387 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._