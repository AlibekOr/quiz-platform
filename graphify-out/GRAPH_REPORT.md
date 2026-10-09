# Graph Report - quiz-platform  (2026-10-09)

## Corpus Check
- 238 files · ~76,064 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 1222 nodes · 4639 edges · 46 communities (39 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 35 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c130fd2a`
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
- next
- AGENTS.md
- lucide-react
- postcss.config.mjs
- students/import.ts
- Button
- account/actions.ts
- .prettierrc.json
- teacher/students/actions.ts
- time.ts
- attempts.ts
- dotenv
- PageSkeleton
- lib/grades.ts
- requireTeacher
- guards.ts
- grades/actions.ts
- leaderboard-access.ts
- result/[attemptId]/page.tsx
- ConfirmAction
- Badge
- todayInTashkent
- tests/actions.ts
- manager/attendance/page.tsx
- validators/attendance.ts
- app/layout.tsx
- managers/actions.ts
- scope.ts
- use-now.ts
- sheet.tsx
- lib/leaderboard.ts
- homePathFor
- jwt.ts
- getCurrentUser
- login/page.tsx

## God Nodes (most connected - your core abstractions)
1. `Button()` - 104 edges
2. `requireTeacher()` - 97 edges
3. `next` - 82 edges
4. `Input()` - 58 edges
5. `db` - 55 edges
6. `lucide-react` - 54 edges
7. `react` - 53 edges
8. `FormError()` - 51 edges
9. `Badge()` - 50 edges
10. `applyServerErrors()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `7-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `13-bosqich: menejerlar, regionlar va o'chirish so'rovlari` --references--> `requireRole()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Majburiy qoidalar` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `11-bosqich: boshqa guruhga o'tkazish` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `13-bosqich: menejerlar, regionlar va o'chirish so'rovlari` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (46 total, 7 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.08
Nodes (24): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+16 more)

### Community 2 - "lib/attendance.ts"
Cohesion: 0.15
Nodes (19): CELL_CLASS, AttendanceReport, AttendanceStats, buildAttendanceReport(), computeStats(), FILL, HEADER_ROW, isPresent() (+11 more)

### Community 3 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+10 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.05
Nodes (39): Buyruqlar, graphify, Ish tartibi, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari, 10-bosqich: o'quvchilarni boshqarish (+31 more)

### Community 5 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "scripts"
Cohesion: 0.12
Nodes (17): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:seed:prod, db:studio (+9 more)

### Community 7 - "dependencies"
Cohesion: 0.10
Nodes (21): dependencies, @base-ui/react, bcryptjs, class-variance-authority, cn, exceljs, @hookform/resolvers, jose (+13 more)

### Community 8 - "next"
Cohesion: 0.19
Nodes (14): nextConfig, next, ManagerHomePage(), metadata, DashboardPage(), AttendanceSheetPage(), metadata, AttendancePage() (+6 more)

### Community 10 - "lucide-react"
Cohesion: 0.09
Nodes (31): lucide-react, Error(), metadata, NotFound(), metadata, metadata, NotFound(), Error() (+23 more)

### Community 12 - "students/import.ts"
Cohesion: 0.09
Nodes (31): validateAgainstDb(), cellToString(), Column, firstError(), IMPORT_COLUMNS, ImportRow, MAX_IMPORT_ROWS, OPTIONAL_COLUMNS (+23 more)

### Community 13 - "Button"
Cohesion: 0.06
Nodes (115): @base-ui/react, cn, @hookform/resolvers, react, react-hook-form, sonner, AccountPage(), metadata (+107 more)

### Community 14 - "account/actions.ts"
Cohesion: 0.17
Nodes (19): bcryptjs, changeOwnPassword(), updateOwnProfile(), login(), verifyAgainstDummy(), verifyPassword(), clearLoginFailures(), isLoginLocked() (+11 more)

### Community 16 - "teacher/students/actions.ts"
Cohesion: 0.11
Nodes (36): resetManagerPassword(), createStudent(), deleteStudent(), forbiddenStudent(), groupExists(), idSchema, ImportPreview, ImportPreviewRow (+28 more)

### Community 17 - "time.ts"
Cohesion: 0.10
Nodes (33): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SCHEDULES, SeedQuestion, TEACHER_ONLY (+25 more)

### Community 18 - "attempts.ts"
Cohesion: 0.12
Nodes (24): ATTEMPT_MISSING, idSchema, saveAnswer(), SaveAnswerResult, startAttempt(), submitAttempt(), start(), submit() (+16 more)

### Community 20 - "PageSkeleton"
Cohesion: 0.46
Nodes (4): Loading(), Loading(), Loading(), PageSkeleton()

### Community 21 - "lib/grades.ts"
Cohesion: 0.13
Nodes (27): GET(), metadata, MyGradesPage(), GradeSheetTable(), cellText(), computeStudentGrades(), getStudentGrades(), buildGradesWorkbook() (+19 more)

### Community 22 - "requireTeacher"
Cohesion: 0.15
Nodes (29): addExemption(), addPointAdjustment(), createPeriod(), deleteExemption(), deletePeriod(), deletePointAdjustment(), revalidateGrades(), saveTestGrading() (+21 more)

### Community 23 - "guards.ts"
Cohesion: 0.12
Nodes (17): server-only, ManagerRequestsPage(), metadata, metadata, metadata, requestTime(), TestPage(), metadata (+9 more)

### Community 24 - "grades/actions.ts"
Cohesion: 0.11
Nodes (25): idSchema, nameTaken, createHomework(), deleteHomework(), idSchema, periodMissing(), revalidate(), saveHomeworkGrades() (+17 more)

### Community 25 - "leaderboard-access.ts"
Cohesion: 0.17
Nodes (18): LeaderboardPage(), metadata, one(), metadata, one(), TestLeaderboardPage(), LeaderboardView(), MEDALS (+10 more)

### Community 27 - "result/[attemptId]/page.tsx"
Cohesion: 0.16
Nodes (19): loadAttempt(), MARK_STYLES, MarkBanner(), metadata, ResultPage(), Stat(), cancelStudentAttempt(), metadata (+11 more)

### Community 30 - "ConfirmAction"
Cohesion: 0.29
Nodes (14): ConfirmAction(), StartTestButton(), SaveIndicator(), TestRunner(), AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent() (+6 more)

### Community 31 - "Badge"
Cohesion: 0.06
Nodes (75): exceljs, GET(), GET(), GroupsPage(), metadata, HomeworkPage(), metadata, param() (+67 more)

### Community 32 - "todayInTashkent"
Cohesion: 0.15
Nodes (23): GradesPage(), metadata, param(), HomeworkGradesPage(), metadata, buildGradeSheet(), buildSheet(), getPeriodGrades() (+15 more)

### Community 33 - "tests/actions.ts"
Cohesion: 0.06
Nodes (54): vitest, createQuestion(), deleteQuestion(), deleteTest(), idSchema, importQuestions(), moveQuestion(), nextOrder() (+46 more)

### Community 34 - "manager/attendance/page.tsx"
Cohesion: 0.23
Nodes (16): GET(), ManagerAttendancePage(), metadata, param(), GroupAttendanceReportPage(), metadata, AttendanceReportView(), MonthPicker() (+8 more)

### Community 35 - "validators/attendance.ts"
Cohesion: 0.20
Nodes (9): ATTENDANCE_STATUSES, attendanceExportQuerySchema, AttendanceFormInput, attendanceFormSchema, dateParam, ScheduleFormInput, scheduleFormSchema, scheduleRowSchema (+1 more)

### Community 36 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 37 - "managers/actions.ts"
Cohesion: 0.11
Nodes (28): zod, idSchema, createGroup(), deleteGroup(), idSchema, regionMissing(), revalidate(), setGroupRegion() (+20 more)

### Community 38 - "scope.ts"
Cohesion: 0.19
Nodes (17): Majburiy qoidalar, requestStudentDeletion(), ManagerImportStudentsPage(), metadata, ManagerStudentsPage(), param(), requireManager(), canAccessGroup() (+9 more)

### Community 39 - "use-now.ts"
Cohesion: 0.70
Nodes (4): getServerSnapshot(), getSnapshot(), subscribe(), useNow()

### Community 40 - "sheet.tsx"
Cohesion: 0.22
Nodes (12): MobileNav(), LINKS, NavLink, NavLinks(), NavVariant, Sheet(), SheetContent(), SheetHeader() (+4 more)

### Community 41 - "lib/leaderboard.ts"
Cohesion: 0.20
Nodes (9): Filter, getOverallLeaderboard(), getTestLeaderboard(), groupFilter(), LEADERBOARD_LIMIT, LeaderboardEntry, Row, split() (+1 more)

### Community 42 - "homePathFor"
Cohesion: 0.23
Nodes (10): 13-bosqich: menejerlar, regionlar va o'chirish so'rovlari, Home(), requireStaff(), requireUser(), homePathFor(), Role, allowedRoles(), under() (+2 more)

### Community 43 - "jwt.ts"
Cohesion: 0.29
Nodes (11): jose, decodeSession(), encodeSession(), getKey(), HOME, isRole(), ROLES, SESSION_COOKIE (+3 more)

### Community 44 - "getCurrentUser"
Cohesion: 0.23
Nodes (10): GET(), ManagerLayout(), StudentLayout(), TeacherLayout(), LogoutButton(), StaffShell(), logout(), getCurrentUser (+2 more)

### Community 45 - "login/page.tsx"
Cohesion: 0.36
Nodes (7): LoginPage(), metadata, Card(), CardContent(), CardDescription(), CardHeader(), CardTitle()

## Knowledge Gaps
- **302 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+297 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 371 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `lib/attendance.ts`, `lucide-react`, `Button`, `account/actions.ts`, `teacher/students/actions.ts`, `time.ts`, `attempts.ts`, `lib/grades.ts`, `guards.ts`, `grades/actions.ts`, `leaderboard-access.ts`, `result/[attemptId]/page.tsx`, `ConfirmAction`, `Badge`, `todayInTashkent`, `tests/actions.ts`, `manager/attendance/page.tsx`, `app/layout.tsx`, `managers/actions.ts`, `scope.ts`, `sheet.tsx`, `homePathFor`, `jwt.ts`, `getCurrentUser`, `login/page.tsx`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `todayInTashkent`, `tests/actions.ts`, `manager/attendance/page.tsx`, `Bosqichlar`, `managers/actions.ts`, `scope.ts`, `next`, `homePathFor`, `lucide-react`, `Button`, `account/actions.ts`, `teacher/students/actions.ts`, `time.ts`, `guards.ts`, `grades/actions.ts`, `leaderboard-access.ts`, `result/[attemptId]/page.tsx`, `Badge`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `Button()` connect `Button` to `tests/actions.ts`, `sheet.tsx`, `lucide-react`, `getCurrentUser`, `result/[attemptId]/page.tsx`, `ConfirmAction`, `Badge`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `11-bosqich: boshqa guruhga o'tkazish`) actually correct?**
  _`requireTeacher()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _302 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08307692307692308 - nodes in this community are weakly interconnected._