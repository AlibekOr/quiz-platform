# Graph Report - quiz-platform  (2026-10-11)

## Corpus Check
- 266 files · ~84,677 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 1355 nodes · 5153 edges · 43 communities (36 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `87e3f9ad`
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
- time.ts
- AGENTS.md
- guards.ts
- postcss.config.mjs
- students/import.ts
- Button
- profile/actions.ts
- .prettierrc.json
- teacher/students/actions.ts
- todayInTashkent
- test-runner.tsx
- dotenv
- PageSkeleton
- lib/grades.ts
- requireTeacher
- lib/db.ts
- grades/actions.ts
- Badge
- common/date-picker.tsx
- test-results-view.tsx
- manager/students/page.tsx
- grades-data.ts
- tests/actions.ts
- attendance-data.ts
- toDbDate
- app/layout.tsx
- managers/actions.ts
- next
- buttonVariants
- nav-menu.tsx
- errorText
- getScope

## God Nodes (most connected - your core abstractions)
1. `Button()` - 107 edges
2. `next` - 94 edges
3. `requireTeacher()` - 87 edges
4. `db` - 59 edges
5. `react` - 58 edges
6. `lucide-react` - 55 edges
7. `FormError()` - 53 edges
8. `Input()` - 52 edges
9. `Badge()` - 50 edges
10. `applyServerErrors()` - 45 edges

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

## Communities (43 total, 7 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.08
Nodes (25): eslintConfig, name, packageManager, private, version, bcryptjs, class-variance-authority, eslint (+17 more)

### Community 2 - "lib/attendance.ts"
Cohesion: 0.12
Nodes (22): CELL_CLASS, AttendanceMark, AttendanceReport, AttendanceStats, buildAttendanceReport(), FILL, HEADER_ROW, MARK_LABEL (+14 more)

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

### Community 8 - "time.ts"
Cohesion: 0.13
Nodes (20): GET(), GroupPage(), metadata, RemoveFromGroupButton(), ScheduleForm(), attendanceFileName(), buildAttendanceWorkbook(), day() (+12 more)

### Community 10 - "guards.ts"
Cohesion: 0.07
Nodes (38): AccountLayout(), LoginPage(), metadata, ManagerLayout(), ManagerRequestsPage(), metadata, ManagerImportStudentsPage(), metadata (+30 more)

### Community 12 - "students/import.ts"
Cohesion: 0.09
Nodes (31): exceljs, buildStudentsWorkbook(), EXPORT_HEADERS, ExportStudent, cellToString(), Column, firstError(), IMPORT_COLUMNS (+23 more)

### Community 13 - "Button"
Cohesion: 0.06
Nodes (115): cn, @hookform/resolvers, lucide-react, react, react-hook-form, sonner, LoginForm(), ConfirmAction() (+107 more)

### Community 14 - "profile/actions.ts"
Cohesion: 0.06
Nodes (63): 13-bosqich: menejerlar, regionlar va o'chirish so'rovlari, jose, vitest, changeOwnPassword(), updateOwnContacts(), ManagerSection(), metadata, ProfilePage() (+55 more)

### Community 16 - "teacher/students/actions.ts"
Cohesion: 0.09
Nodes (39): 11-bosqich: boshqa guruhga o'tkazish, createStudent(), deleteStudent(), forbiddenStudent(), groupExists(), idSchema, ImportPreview, ImportPreviewRow (+31 more)

### Community 17 - "todayInTashkent"
Cohesion: 0.15
Nodes (22): CSS_QUESTIONS, db, GROUPS, main(), requireEnv(), SCHEDULES, SeedQuestion, TEACHER_ONLY (+14 more)

### Community 18 - "test-runner.tsx"
Cohesion: 0.08
Nodes (46): ATTEMPT_MISSING, idSchema, saveAnswer(), SaveAnswerResult, startAttempt(), submitAttempt(), metadata, requestTime() (+38 more)

### Community 20 - "PageSkeleton"
Cohesion: 0.38
Nodes (5): Loading(), Loading(), Loading(), Loading(), PageSkeleton()

### Community 21 - "lib/grades.ts"
Cohesion: 0.13
Nodes (27): GET(), metadata, MyGradesPage(), GradeSheetTable(), cellText(), computeStudentGrades(), getStudentGrades(), buildGradesWorkbook() (+19 more)

### Community 22 - "requireTeacher"
Cohesion: 0.13
Nodes (38): updateOwnProfile(), addExemption(), addPointAdjustment(), createPeriod(), deleteExemption(), deletePeriod(), deletePointAdjustment(), revalidateGrades() (+30 more)

### Community 23 - "lib/db.ts"
Cohesion: 0.09
Nodes (25): 14-bosqich: menejer testlari, server-only, metadata, metadata, RegionsPage(), cancelAttempt(), CurrentUser, canAccessStudent() (+17 more)

### Community 24 - "grades/actions.ts"
Cohesion: 0.11
Nodes (25): idSchema, nameTaken, createHomework(), deleteHomework(), idSchema, periodMissing(), revalidate(), saveHomeworkGrades() (+17 more)

### Community 25 - "Badge"
Cohesion: 0.13
Nodes (25): DashboardPage(), metadata, loadAttempt(), MARK_STYLES, MarkBanner(), metadata, ResultPage(), Stat() (+17 more)

### Community 27 - "common/date-picker.tsx"
Cohesion: 0.19
Nodes (16): DatePicker(), inRange(), MonthPicker(), NavButton(), PICKER_TRIGGER_CLASS, pickerCellClass(), PickerProps, Column() (+8 more)

### Community 30 - "test-results-view.tsx"
Cohesion: 0.08
Nodes (43): Majburiy qoidalar, GET(), GET(), metadata, Page(), MarkBadge(), one(), QuestionSummary() (+35 more)

### Community 31 - "manager/students/page.tsx"
Cohesion: 0.28
Nodes (9): ManagerStudentsPage(), metadata, param(), metadata, param(), StudentsPage(), AddStudentButton(), StudentFilters() (+1 more)

### Community 32 - "grades-data.ts"
Cohesion: 0.13
Nodes (23): GradesPage(), metadata, param(), HomeworkGradesPage(), metadata, ParamSelect(), getAttendanceReport(), buildGradeSheet() (+15 more)

### Community 33 - "tests/actions.ts"
Cohesion: 0.06
Nodes (56): cancelStudentAttempt(), createQuestion(), createTest(), deleteQuestion(), deleteTest(), idSchema, importQuestions(), moveQuestion() (+48 more)

### Community 34 - "attendance-data.ts"
Cohesion: 0.21
Nodes (14): ManagerAttendancePage(), metadata, param(), metadata, param(), TeacherAttendanceReportPage(), AttendanceReportPage(), ReportPageData (+6 more)

### Community 35 - "toDbDate"
Cohesion: 0.16
Nodes (15): idSchema, saveAttendance(), transferStudents(), exemptBeforeTransfer(), isValidDateStr(), toDbDate(), ATTENDANCE_STATUSES, attendanceExportQuerySchema (+7 more)

### Community 36 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 37 - "managers/actions.ts"
Cohesion: 0.13
Nodes (23): zod, idSchema, requestStudentDeletion(), idSchema, regionTaken, usernameTaken, idSchema, ActionResult (+15 more)

### Community 38 - "next"
Cohesion: 0.14
Nodes (30): nextConfig, next, GroupsPage(), metadata, HomeworkPage(), metadata, param(), ManagersPage() (+22 more)

### Community 39 - "buttonVariants"
Cohesion: 0.17
Nodes (15): Error(), Error(), metadata, NotFound(), metadata, NotFound(), Error(), metadata (+7 more)

### Community 40 - "nav-menu.tsx"
Cohesion: 0.09
Nodes (39): @base-ui/react, MobileNav(), CountBadge(), listeners, memory, MenuGroup, MenuItem, MenuLink (+31 more)

### Community 41 - "errorText"
Cohesion: 0.67
Nodes (3): errorText(), save(), add()

### Community 43 - "getScope"
Cohesion: 0.11
Nodes (31): GET(), LeaderboardPage(), metadata, one(), metadata, one(), TestLeaderboardPage(), LeaderboardGroupSelect() (+23 more)

## Knowledge Gaps
- **322 isolated node(s):** `metadata`, `ROLE_LABEL`, `MenuLink`, `MenuGroup`, `MenuItem` (+317 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 400 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `package.json`, `lib/attendance.ts`, `time.ts`, `guards.ts`, `Button`, `profile/actions.ts`, `teacher/students/actions.ts`, `todayInTashkent`, `test-runner.tsx`, `lib/grades.ts`, `requireTeacher`, `lib/db.ts`, `grades/actions.ts`, `Badge`, `common/date-picker.tsx`, `test-results-view.tsx`, `manager/students/page.tsx`, `grades-data.ts`, `tests/actions.ts`, `attendance-data.ts`, `toDbDate`, `app/layout.tsx`, `managers/actions.ts`, `buttonVariants`, `nav-menu.tsx`, `getScope`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Why does `requireTeacher()` connect `requireTeacher` to `grades-data.ts`, `tests/actions.ts`, `attendance-data.ts`, `toDbDate`, `Bosqichlar`, `managers/actions.ts`, `next`, `time.ts`, `guards.ts`, `getScope`, `profile/actions.ts`, `teacher/students/actions.ts`, `todayInTashkent`, `lib/db.ts`, `grades/actions.ts`, `Badge`, `test-results-view.tsx`, `manager/students/page.tsx`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Button` to `grades-data.ts`, `package.json`, `attendance-data.ts`, `lib/attendance.ts`, `app/layout.tsx`, `next`, `buttonVariants`, `time.ts`, `nav-menu.tsx`, `guards.ts`, `todayInTashkent`, `test-runner.tsx`, `lib/db.ts`, `Badge`, `common/date-picker.tsx`, `test-results-view.tsx`, `manager/students/page.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `11-bosqich: boshqa guruhga o'tkazish`) actually correct?**
  _`requireTeacher()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `metadata`, `ROLE_LABEL`, `MenuLink` to the rest of the system?**
  _322 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07977207977207977 - nodes in this community are weakly interconnected._