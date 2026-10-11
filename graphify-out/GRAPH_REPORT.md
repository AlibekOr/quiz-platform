# Graph Report - quiz-platform  (2026-10-11)

## Corpus Check
- 255 files · ~81,472 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 1296 nodes · 4927 edges · 43 communities (36 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `58c029af`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- package.json
- lib/attendance.ts
- devDependencies
- Bosqichlar
- components.json
- scripts
- dependencies
- requireManager
- AGENTS.md
- buttonVariants
- postcss.config.mjs
- students/import.ts
- Button
- account/actions.ts
- .prettierrc.json
- teacher/students/actions.ts
- next
- attempt-view.tsx
- dotenv
- PageSkeleton
- lib/grades.ts
- groups/actions.ts
- lib/db.ts
- requireTeacher
- leaderboard-access.ts
- seed.ts
- test-results-view.tsx
- manager/students/page.tsx
- grades-data.ts
- tests/actions.ts
- attendance-data.ts
- validators/attendance.ts
- app/layout.tsx
- managers/actions.ts
- regions-section.tsx
- nav-menu.tsx
- teacher/requests/page.tsx
- groupScopeWhere
- guards.ts

## God Nodes (most connected - your core abstractions)
1. `Button()` - 102 edges
2. `next` - 93 edges
3. `requireTeacher()` - 90 edges
4. `Input()` - 58 edges
5. `db` - 56 edges
6. `react` - 54 edges
7. `lucide-react` - 53 edges
8. `FormError()` - 51 edges
9. `Badge()` - 50 edges
10. `applyServerErrors()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `7-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `Majburiy qoidalar` --references--> `requireStudent()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `13-bosqich: menejerlar, regionlar va o'chirish so'rovlari` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireStudent()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Majburiy qoidalar` --references--> `groupScopeWhere()`  [INFERRED]
  CLAUDE.md → src/lib/auth/scope.ts

## Import Cycles
- None detected.

## Communities (43 total, 7 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.08
Nodes (24): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+16 more)

### Community 2 - "lib/attendance.ts"
Cohesion: 0.12
Nodes (25): GET(), AttendanceReportView(), CELL_CLASS, attendanceFileName(), AttendanceMark, AttendanceReport, AttendanceStats, buildAttendanceReport() (+17 more)

### Community 3 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+10 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.05
Nodes (37): Buyruqlar, graphify, Ish tartibi, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari, 10-bosqich: o'quvchilarni boshqarish (+29 more)

### Community 5 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:seed:prod, db:studio (+9 more)

### Community 7 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, @base-ui/react, bcryptjs, class-variance-authority, cn, exceljs, @hookform/resolvers, jose (+13 more)

### Community 8 - "requireManager"
Cohesion: 0.11
Nodes (22): Majburiy qoidalar, 13-bosqich: menejerlar, regionlar va o'chirish so'rovlari, 14-bosqich: menejer testlari, metadata, Page(), metadata, Page(), metadata (+14 more)

### Community 10 - "buttonVariants"
Cohesion: 0.19
Nodes (14): Error(), metadata, NotFound(), metadata, NotFound(), Error(), metadata, NotFound() (+6 more)

### Community 12 - "students/import.ts"
Cohesion: 0.09
Nodes (31): exceljs, buildStudentsWorkbook(), EXPORT_HEADERS, ExportStudent, cellToString(), Column, firstError(), IMPORT_COLUMNS (+23 more)

### Community 13 - "Button"
Cohesion: 0.06
Nodes (122): @base-ui/react, cn, @hookform/resolvers, lucide-react, react, react-hook-form, sonner, AccountPage() (+114 more)

### Community 14 - "account/actions.ts"
Cohesion: 0.07
Nodes (46): bcryptjs, jose, LoginPage(), metadata, Home(), changeOwnPassword(), Card(), CardContent() (+38 more)

### Community 16 - "teacher/students/actions.ts"
Cohesion: 0.08
Nodes (44): 11-bosqich: boshqa guruhga o'tkazish, resetManagerPassword(), createStudent(), deleteStudent(), forbiddenStudent(), groupExists(), idSchema, ImportPreview (+36 more)

### Community 17 - "next"
Cohesion: 0.13
Nodes (31): nextConfig, next, ManagerHomePage(), metadata, DashboardPage(), metadata, idSchema, saveAttendance() (+23 more)

### Community 18 - "attempt-view.tsx"
Cohesion: 0.06
Nodes (65): metadata, Page(), loadAttempt(), MARK_STYLES, MarkBanner(), metadata, ResultPage(), Stat() (+57 more)

### Community 20 - "PageSkeleton"
Cohesion: 0.46
Nodes (4): Loading(), Loading(), Loading(), PageSkeleton()

### Community 21 - "lib/grades.ts"
Cohesion: 0.15
Nodes (25): metadata, MyGradesPage(), GradeSheetTable(), buildGradeSheet(), cellText(), computeStudentGrades(), buildGradesWorkbook(), GRADES_HEADER_ROW (+17 more)

### Community 22 - "groups/actions.ts"
Cohesion: 0.38
Nodes (10): createGroup(), deleteGroup(), idSchema, regionMissing(), renameGroup(), revalidate(), setGroupRegion(), updateStudent() (+2 more)

### Community 23 - "lib/db.ts"
Cohesion: 0.14
Nodes (12): server-only, vitest, ActionResult, FORBIDDEN, getAccessibleGroupIds(), ScopeUser, db, globalForPrisma (+4 more)

### Community 24 - "requireTeacher"
Cohesion: 0.09
Nodes (41): updateOwnProfile(), addExemption(), addPointAdjustment(), createPeriod(), deleteExemption(), deletePeriod(), deletePointAdjustment(), idSchema (+33 more)

### Community 25 - "leaderboard-access.ts"
Cohesion: 0.16
Nodes (15): EMPTY, LeaderboardScope, Filter, getOverallLeaderboard(), getTestLeaderboard(), groupFilter(), Leaderboard, LEADERBOARD_LIMIT (+7 more)

### Community 27 - "seed.ts"
Cohesion: 0.14
Nodes (15): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SCHEDULES, SeedQuestion, TEACHER_ONLY (+7 more)

### Community 30 - "test-results-view.tsx"
Cohesion: 0.05
Nodes (75): ManagerImportStudentsPage(), metadata, metadata, Page(), metadata, Page(), GroupsPage(), metadata (+67 more)

### Community 31 - "manager/students/page.tsx"
Cohesion: 0.22
Nodes (13): GET(), GET(), ManagerStudentsPage(), metadata, param(), canAccessGroup(), Scope, studentScopeWhere() (+5 more)

### Community 32 - "grades-data.ts"
Cohesion: 0.14
Nodes (23): GET(), GradesPage(), metadata, param(), HomeworkGradesPage(), metadata, buildSheet(), getPeriodGrades() (+15 more)

### Community 33 - "tests/actions.ts"
Cohesion: 0.08
Nodes (50): cancelStudentAttempt(), createQuestion(), createTest(), deleteQuestion(), deleteTest(), idSchema, importQuestions(), moveQuestion() (+42 more)

### Community 34 - "attendance-data.ts"
Cohesion: 0.19
Nodes (15): ManagerAttendancePage(), metadata, param(), metadata, param(), TeacherAttendanceReportPage(), AttendanceReportPage(), ReportPageData (+7 more)

### Community 35 - "validators/attendance.ts"
Cohesion: 0.20
Nodes (9): ATTENDANCE_STATUSES, attendanceExportQuerySchema, AttendanceFormInput, attendanceFormSchema, dateParam, ScheduleFormInput, scheduleFormSchema, scheduleRowSchema (+1 more)

### Community 36 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 37 - "managers/actions.ts"
Cohesion: 0.09
Nodes (34): zod, idSchema, requestStudentDeletion(), createManager(), idSchema, isUsernameTaken(), regionMissing(), regionTaken (+26 more)

### Community 38 - "regions-section.tsx"
Cohesion: 0.30
Nodes (10): createRegion(), renameRegion(), metadata, RegionsPage(), errorText(), RegionItem(), save(), RegionRow (+2 more)

### Community 40 - "nav-menu.tsx"
Cohesion: 0.10
Nodes (37): MobileNav(), CountBadge(), listeners, memory, MenuGroup, MenuItem, MenuLink, MENUS (+29 more)

### Community 42 - "teacher/requests/page.tsx"
Cohesion: 0.33
Nodes (6): ManagerRequestsPage(), metadata, metadata, RequestsPage(), RequestStatusBadge(), Status

### Community 43 - "groupScopeWhere"
Cohesion: 0.24
Nodes (14): LeaderboardPage(), metadata, one(), metadata, one(), TestLeaderboardPage(), LeaderboardGroupSelect(), LeaderboardView() (+6 more)

### Community 44 - "guards.ts"
Cohesion: 0.31
Nodes (9): GET(), ManagerLayout(), StudentLayout(), TeacherLayout(), AppShell(), TITLES, variantFor(), getCurrentUser (+1 more)

## Knowledge Gaps
- **316 isolated node(s):** `metadata`, `idSchema`, `metadata`, `metadata`, `idSchema` (+311 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 388 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `lib/attendance.ts`, `requireManager`, `buttonVariants`, `Button`, `account/actions.ts`, `teacher/students/actions.ts`, `attempt-view.tsx`, `lib/grades.ts`, `groups/actions.ts`, `requireTeacher`, `test-results-view.tsx`, `manager/students/page.tsx`, `grades-data.ts`, `tests/actions.ts`, `attendance-data.ts`, `app/layout.tsx`, `managers/actions.ts`, `regions-section.tsx`, `nav-menu.tsx`, `teacher/requests/page.tsx`, `groupScopeWhere`, `guards.ts`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `grades-data.ts`, `attendance-data.ts`, `Bosqichlar`, `managers/actions.ts`, `regions-section.tsx`, `requireManager`, `teacher/requests/page.tsx`, `groupScopeWhere`, `guards.ts`, `Button`, `account/actions.ts`, `teacher/students/actions.ts`, `next`, `attempt-view.tsx`, `groups/actions.ts`, `test-results-view.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Button` to `grades-data.ts`, `package.json`, `attendance-data.ts`, `lib/attendance.ts`, `app/layout.tsx`, `regions-section.tsx`, `nav-menu.tsx`, `requireManager`, `buttonVariants`, `next`, `attempt-view.tsx`, `test-results-view.tsx`, `manager/students/page.tsx`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `11-bosqich: boshqa guruhga o'tkazish`) actually correct?**
  _`requireTeacher()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `idSchema`, `metadata` to the rest of the system?**
  _316 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08307692307692308 - nodes in this community are weakly interconnected._