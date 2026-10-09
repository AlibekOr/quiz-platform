# Graph Report - quiz-platform  (2026-10-09)

## Corpus Check
- 250 files · ~78,720 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 1260 nodes · 4856 edges · 46 communities (39 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f5f151c3`
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
- error-view.tsx
- postcss.config.mjs
- students/import.ts
- Button
- account/actions.ts
- .prettierrc.json
- teacher/students/actions.ts
- time.ts
- attempt-view.tsx
- dotenv
- PageSkeleton
- lib/grades.ts
- validationFailed
- lib/db.ts
- homework/actions.ts
- manager/students/page.tsx
- test-results-view.tsx
- Badge
- lib/results.ts
- grades-data.ts
- tests/actions.ts
- buttonVariants
- vitest
- app/layout.tsx
- managers/actions.ts
- scope.ts
- requireTeacher
- sheet.tsx
- ImportStudents
- formatDateTime
- jwt.ts
- getCurrentUser
- login/page.tsx

## God Nodes (most connected - your core abstractions)
1. `Button()` - 104 edges
2. `next` - 92 edges
3. `requireTeacher()` - 86 edges
4. `Input()` - 58 edges
5. `db` - 57 edges
6. `lucide-react` - 54 edges
7. `react` - 53 edges
8. `FormError()` - 51 edges
9. `Badge()` - 50 edges
10. `applyServerErrors()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `7-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `Majburiy qoidalar` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `11-bosqich: boshqa guruhga o'tkazish` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `13-bosqich: menejerlar, regionlar va o'chirish so'rovlari` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `14-bosqich: menejer testlari` --references--> `requireTeacher()`  [INFERRED]
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
Cohesion: 0.12
Nodes (23): GET(), CELL_CLASS, attendanceFileName(), AttendanceMark, AttendanceReport, AttendanceStats, buildAttendanceWorkbook(), computeStats() (+15 more)

### Community 3 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+10 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.05
Nodes (38): Buyruqlar, graphify, Ish tartibi, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari, 10-bosqich: o'quvchilarni boshqarish (+30 more)

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
Cohesion: 0.11
Nodes (28): nextConfig, 14-bosqich: menejer testlari, next, ManagerImportStudentsPage(), metadata, metadata, Page(), metadata (+20 more)

### Community 10 - "error-view.tsx"
Cohesion: 0.16
Nodes (13): Error(), metadata, NotFound(), metadata, NotFound(), Error(), metadata, NotFound() (+5 more)

### Community 12 - "students/import.ts"
Cohesion: 0.07
Nodes (38): exceljs, GET(), validateAgainstDb(), fileSafe(), buildStudentsWorkbook(), EXPORT_HEADERS, ExportStudent, cellToString() (+30 more)

### Community 13 - "Button"
Cohesion: 0.06
Nodes (115): @base-ui/react, cn, @hookform/resolvers, lucide-react, react, react-hook-form, sonner, AccountPage() (+107 more)

### Community 14 - "account/actions.ts"
Cohesion: 0.18
Nodes (18): bcryptjs, changeOwnPassword(), login(), verifyAgainstDummy(), verifyPassword(), clearLoginFailures(), isLoginLocked(), LOGIN_MAX_FAILURES (+10 more)

### Community 16 - "teacher/students/actions.ts"
Cohesion: 0.12
Nodes (28): createStudent(), forbiddenStudent(), groupExists(), idSchema, ImportPreview, ImportPreviewRow, ImportResult, requireStaffScope() (+20 more)

### Community 17 - "time.ts"
Cohesion: 0.16
Nodes (28): main(), ManagerHomePage(), metadata, saveAttendance(), AttendanceSheetPage(), metadata, AttendancePage(), metadata (+20 more)

### Community 18 - "attempt-view.tsx"
Cohesion: 0.06
Nodes (63): DashboardPage(), metadata, loadAttempt(), MARK_STYLES, MarkBanner(), metadata, ResultPage(), Stat() (+55 more)

### Community 20 - "PageSkeleton"
Cohesion: 0.46
Nodes (4): Loading(), Loading(), Loading(), PageSkeleton()

### Community 21 - "lib/grades.ts"
Cohesion: 0.12
Nodes (29): GET(), metadata, MyGradesPage(), GradeSheetTable(), buildGradeSheet(), cellText(), computeStudentGrades(), buildSheet() (+21 more)

### Community 22 - "validationFailed"
Cohesion: 0.17
Nodes (23): updateOwnProfile(), createGroup(), deleteGroup(), idSchema, regionMissing(), renameGroup(), revalidate(), saveSchedule() (+15 more)

### Community 23 - "lib/db.ts"
Cohesion: 0.10
Nodes (11): CSS_QUESTIONS, db, GROUPS, requireEnv(), SCHEDULES, SeedQuestion, TEACHER_ONLY, @prisma/adapter-pg (+3 more)

### Community 24 - "homework/actions.ts"
Cohesion: 0.10
Nodes (21): createHomework(), idSchema, periodMissing(), revalidate(), saveHomeworkGrades(), updateHomework(), AdjustmentInput, adjustmentSchema (+13 more)

### Community 25 - "manager/students/page.tsx"
Cohesion: 0.07
Nodes (39): GET(), ManagerStudentsPage(), metadata, param(), LeaderboardPage(), metadata, one(), metadata (+31 more)

### Community 27 - "test-results-view.tsx"
Cohesion: 0.15
Nodes (17): metadata, Page(), metadata, Page(), MARK_CLASS, MarkBadge(), one(), QuestionSummary() (+9 more)

### Community 30 - "Badge"
Cohesion: 0.22
Nodes (23): GroupsPage(), metadata, HomeworkPage(), metadata, param(), ManagersPage(), metadata, ContactLine() (+15 more)

### Community 31 - "lib/results.ts"
Cohesion: 0.10
Nodes (30): GET(), sortHead(), canAccessGroup(), Scope, percent(), AttemptSummary, buildResultsCsv(), buildStudentRows() (+22 more)

### Community 32 - "grades-data.ts"
Cohesion: 0.13
Nodes (26): HomeworkGradesPage(), metadata, transferStudents(), buildAttendanceReport(), getAttendanceReport(), SheetRow, exemptBeforeTransfer(), historySelect (+18 more)

### Community 33 - "tests/actions.ts"
Cohesion: 0.07
Nodes (53): createQuestion(), createTest(), deleteQuestion(), deleteTest(), idSchema, importQuestions(), moveQuestion(), nextOrder() (+45 more)

### Community 34 - "buttonVariants"
Cohesion: 0.18
Nodes (17): ManagerAttendancePage(), metadata, param(), GradesPage(), metadata, param(), GroupAttendanceReportPage(), metadata (+9 more)

### Community 35 - "vitest"
Cohesion: 0.17
Nodes (11): vitest, idSchema, ATTENDANCE_STATUSES, attendanceExportQuerySchema, AttendanceFormInput, attendanceFormSchema, dateParam, ScheduleFormInput (+3 more)

### Community 36 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 37 - "managers/actions.ts"
Cohesion: 0.11
Nodes (25): zod, idSchema, requestStudentDeletion(), ATTEMPT_MISSING, idSchema, SaveAnswerResult, idSchema, regionTaken (+17 more)

### Community 38 - "scope.ts"
Cohesion: 0.26
Nodes (13): Majburiy qoidalar, server-only, decideRequest(), submit(), canAccessStudent(), FORBIDDEN, getAccessibleGroupIds(), getScope() (+5 more)

### Community 39 - "requireTeacher"
Cohesion: 0.21
Nodes (21): addExemption(), addPointAdjustment(), createPeriod(), deleteExemption(), deletePeriod(), deletePointAdjustment(), idSchema, nameTaken (+13 more)

### Community 40 - "sheet.tsx"
Cohesion: 0.22
Nodes (12): MobileNav(), LINKS, NavLink, NavLinks(), NavVariant, Sheet(), SheetContent(), SheetHeader() (+4 more)

### Community 41 - "ImportStudents"
Cohesion: 0.31
Nodes (10): importStudents(), parseStudentFile(), previewStudentImport(), withoutPasswords(), ImportStudentsPage(), metadata, ImportStudents(), onFile() (+2 more)

### Community 42 - "formatDateTime"
Cohesion: 0.36
Nodes (7): ManagerRequestsPage(), metadata, metadata, RequestsPage(), RequestStatusBadge(), Status, formatDateTime()

### Community 43 - "jwt.ts"
Cohesion: 0.15
Nodes (21): 13-bosqich: menejerlar, regionlar va o'chirish so'rovlari, jose, Home(), requireRole(), requireUser(), decodeSession(), encodeSession(), getKey() (+13 more)

### Community 44 - "getCurrentUser"
Cohesion: 0.27
Nodes (9): ManagerLayout(), StudentLayout(), TeacherLayout(), LogoutButton(), StaffShell(), logout(), getCurrentUser, getSession (+1 more)

### Community 45 - "login/page.tsx"
Cohesion: 0.36
Nodes (7): LoginPage(), metadata, Card(), CardContent(), CardDescription(), CardHeader(), CardTitle()

## Knowledge Gaps
- **307 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+302 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 380 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `lib/attendance.ts`, `error-view.tsx`, `students/import.ts`, `Button`, `account/actions.ts`, `teacher/students/actions.ts`, `time.ts`, `attempt-view.tsx`, `lib/grades.ts`, `validationFailed`, `homework/actions.ts`, `manager/students/page.tsx`, `test-results-view.tsx`, `Badge`, `lib/results.ts`, `grades-data.ts`, `tests/actions.ts`, `buttonVariants`, `vitest`, `app/layout.tsx`, `managers/actions.ts`, `requireTeacher`, `sheet.tsx`, `ImportStudents`, `formatDateTime`, `jwt.ts`, `getCurrentUser`, `login/page.tsx`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `Bosqichlar`, `next`, `Button`, `account/actions.ts`, `teacher/students/actions.ts`, `time.ts`, `attempt-view.tsx`, `validationFailed`, `homework/actions.ts`, `manager/students/page.tsx`, `test-results-view.tsx`, `Badge`, `grades-data.ts`, `buttonVariants`, `vitest`, `managers/actions.ts`, `scope.ts`, `ImportStudents`, `formatDateTime`, `jwt.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `Button()` connect `Button` to `tests/actions.ts`, `buttonVariants`, `sheet.tsx`, `ImportStudents`, `error-view.tsx`, `getCurrentUser`, `attempt-view.tsx`, `manager/students/page.tsx`, `Badge`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `11-bosqich: boshqa guruhga o'tkazish`) actually correct?**
  _`requireTeacher()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _307 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08307692307692308 - nodes in this community are weakly interconnected._