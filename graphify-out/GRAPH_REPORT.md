# Graph Report - quiz-platform  (2026-10-04)

## Corpus Check
- 12 files · ~2,762 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 91 nodes · 85 edges · 12 communities (9 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c4555c55`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- package.json
- layout.tsx
- devDependencies
- Bosqichlar
- Test platformasi: ish rejasi
- scripts
- dependencies
- README.md
- AGENTS.md
- CLAUDE.md
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `Bosqichlar` - 9 edges
3. `Test platformasi: ish rejasi` - 7 edges
4. `scripts` - 5 edges
5. `next` - 4 edges
6. `eslint` - 2 edges
7. `eslint-config-next` - 2 edges
8. `eslintConfig` - 1 edges
9. `nextConfig` - 1 edges
10. `private` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (12 total, 3 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.12
Nodes (15): eslintConfig, name, packageManager, private, version, eslint, eslint-config-next, react (+7 more)

### Community 2 - "layout.tsx"
Cohesion: 0.18
Nodes (5): nextConfig, next, geistMono, geistSans, metadata

### Community 3 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+1 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.22
Nodes (9): 1-bosqich: loyiha asosi, 2-bosqich: autentifikatsiya, 3-bosqich: o'qituvchi, guruhlar va o'quvchilar, 4-bosqich: testlar va savollar, 5-bosqich: test ishlash, 6-bosqich: reyting, 7-bosqich: o'qituvchi statistikasi, 8-bosqich: sayqal va deploy (+1 more)

### Community 5 - "Test platformasi: ish rejasi"
Cohesion: 0.29
Nodes (6): Biznes qoidalar, Keyingi versiyalar (hozir qilinmaydi), Prisma sxema, Rollar va asosiy imkoniyatlar, Sahifalar, Test platformasi: ish rejasi

### Community 6 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 7 - "dependencies"
Cohesion: 0.50
Nodes (4): dependencies, next, react, react-dom

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **68 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 75 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `layout.tsx` to `package.json`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._