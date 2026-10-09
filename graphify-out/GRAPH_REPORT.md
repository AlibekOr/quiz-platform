# Graph Report - quiz-platform  (2026-10-09)

## Corpus Check
- 209 files · ~66,536 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 1, .toml 1)

## Summary
- 1087 nodes · 3899 edges · 40 communities (33 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `229cdd39`
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
- buttonVariants
- postcss.config.mjs
- students/import.ts
- Button
- guards.ts
- .prettierrc.json
- students/actions.ts
- time.ts
- attempts.ts
- dotenv
- PageSkeleton
- lib/grades.ts
- requireTeacher
- lib/db.ts
- homework/actions.ts
- students/page.tsx
- result/[attemptId]/page.tsx
- test-runner.tsx
- results/page.tsx
- grades-data.ts
- tests/actions.ts
- attendance-data.ts
- validators/attendance.ts
- app/layout.tsx
- ImportQuestions
- validators/results.ts
- use-now.ts

## God Nodes (most connected - your core abstractions)
1. `Button()` - 89 edges
2. `requireTeacher()` - 89 edges
3. `next` - 70 edges
4. `Input()` - 51 edges
5. `react` - 48 edges
6. `lucide-react` - 47 edges
7. `db` - 44 edges
8. `Badge()` - 42 edges
9. `FormError()` - 39 edges
10. `applyServerErrors()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `7-bosqich: reyting` --references--> `finalizeExpiredAttempts()`  [INFERRED]
  PLAN.md → src/lib/attempts.ts
- `13-bosqich: menejerlar, regionlar va o'chirish so'rovlari (keyingi)` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `Majburiy qoidalar` --references--> `requireTeacher()`  [INFERRED]
  CLAUDE.md → src/lib/auth/guards.ts
- `11-bosqich: boshqa guruhga o'tkazish` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts
- `2-bosqich: autentifikatsiya` --references--> `requireTeacher()`  [INFERRED]
  PLAN.md → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (40 total, 7 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 1 - "package.json"
Cohesion: 0.08
Nodes (24): eslintConfig, name, packageManager, private, version, class-variance-authority, eslint, eslint-config-next (+16 more)

### Community 2 - "lib/attendance.ts"
Cohesion: 0.12
Nodes (28): GET(), CELL_CLASS, GroupAttendanceReportPage(), metadata, MonthPicker(), attendanceFileName(), AttendanceMark, AttendanceReport (+20 more)

### Community 3 - "devDependencies"
Cohesion: 0.11
Nodes (18): devDependencies, dotenv, eslint, eslint-config-next, eslint-config-prettier, prettier, prettier-plugin-tailwindcss, prisma (+10 more)

### Community 4 - "Bosqichlar"
Cohesion: 0.05
Nodes (40): Buyruqlar, graphify, Ish tartibi, Majburiy qoidalar, Next.js 16, Papka tuzilmasi, Stack (o'zgartirma, avval so'ra), Test platformasi: loyiha qoidalari (+32 more)

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
Cohesion: 0.16
Nodes (29): nextConfig, next, GroupsPage(), metadata, HomeworkPage(), metadata, param(), ImportPreviewRow (+21 more)

### Community 10 - "buttonVariants"
Cohesion: 0.15
Nodes (17): metadata, NotFound(), Error(), metadata, NotFound(), Error(), metadata, NotFound() (+9 more)

### Community 12 - "students/import.ts"
Cohesion: 0.07
Nodes (37): exceljs, GET(), buildStudentsWorkbook(), EXPORT_HEADERS, ExportStudent, cellToString(), Column, firstError() (+29 more)

### Community 13 - "Button"
Cohesion: 0.06
Nodes (103): @base-ui/react, cn, @hookform/resolvers, lucide-react, react, react-hook-form, sonner, AccountPage() (+95 more)

### Community 14 - "guards.ts"
Cohesion: 0.06
Nodes (57): bcryptjs, jose, LoginPage(), metadata, Home(), StudentLayout(), changeOwnPassword(), TeacherLayout() (+49 more)

### Community 16 - "students/actions.ts"
Cohesion: 0.10
Nodes (35): 11-bosqich: boshqa guruhga o'tkazish, zod, createStudent(), deleteStudent(), groupExists(), idSchema, ImportPreview, ImportResult (+27 more)

### Community 17 - "time.ts"
Cohesion: 0.17
Nodes (28): main(), DashboardPage(), metadata, idSchema, saveAttendance(), AttendanceSheetPage(), metadata, AttendancePage() (+20 more)

### Community 18 - "attempts.ts"
Cohesion: 0.11
Nodes (27): ATTEMPT_MISSING, idSchema, saveAnswer(), SaveAnswerResult, submitAttempt(), metadata, requestTime(), TestPage() (+19 more)

### Community 20 - "PageSkeleton"
Cohesion: 0.60
Nodes (3): Loading(), Loading(), PageSkeleton()

### Community 21 - "lib/grades.ts"
Cohesion: 0.14
Nodes (25): metadata, MyGradesPage(), GradeSheetTable(), buildGradeSheet(), cellText(), computeStudentGrades(), buildGradesWorkbook(), GRADES_HEADER_ROW (+17 more)

### Community 22 - "requireTeacher"
Cohesion: 0.17
Nodes (30): updateOwnProfile(), addExemption(), addPointAdjustment(), createPeriod(), deleteExemption(), deletePeriod(), deletePointAdjustment(), idSchema (+22 more)

### Community 23 - "lib/db.ts"
Cohesion: 0.10
Nodes (14): CSS_QUESTIONS, db, GROUPS, requireEnv(), SCHEDULES, SeedQuestion, TEACHER_ONLY, @prisma/adapter-pg (+6 more)

### Community 24 - "homework/actions.ts"
Cohesion: 0.11
Nodes (22): createHomework(), deleteHomework(), idSchema, periodMissing(), revalidate(), saveHomeworkGrades(), updateHomework(), AdjustmentInput (+14 more)

### Community 25 - "students/page.tsx"
Cohesion: 0.08
Nodes (35): server-only, GET(), LeaderboardPage(), metadata, one(), metadata, one(), TestLeaderboardPage() (+27 more)

### Community 27 - "result/[attemptId]/page.tsx"
Cohesion: 0.19
Nodes (17): loadAttempt(), MARK_STYLES, MarkBanner(), metadata, ResultPage(), Stat(), metadata, Stat() (+9 more)

### Community 30 - "test-runner.tsx"
Cohesion: 0.26
Nodes (15): startAttempt(), StartTestButton(), start(), SaveIndicator(), TestRunner(), AlertDialog(), AlertDialogAction(), AlertDialogCancel() (+7 more)

### Community 31 - "results/page.tsx"
Cohesion: 0.10
Nodes (37): GET(), metadata, one(), QuestionSummary(), ScoreLink(), Stat(), TestResultsPage(), sortHead() (+29 more)

### Community 32 - "grades-data.ts"
Cohesion: 0.15
Nodes (16): GET(), GradesPage(), metadata, param(), ParamSelect(), buildSheet(), getPeriodGrades(), getStudentGrades() (+8 more)

### Community 33 - "tests/actions.ts"
Cohesion: 0.09
Nodes (39): cancelStudentAttempt(), createQuestion(), deleteQuestion(), idSchema, importQuestions(), moveQuestion(), nextOrder(), parseQuestionFile() (+31 more)

### Community 34 - "attendance-data.ts"
Cohesion: 0.20
Nodes (15): HomeworkGradesPage(), metadata, getAttendanceReport(), SheetRow, membershipOverlapWhere(), Tx, Departure, describeDeparture() (+7 more)

### Community 35 - "validators/attendance.ts"
Cohesion: 0.20
Nodes (9): ATTENDANCE_STATUSES, attendanceExportQuerySchema, AttendanceFormInput, attendanceFormSchema, dateParam, ScheduleFormInput, scheduleFormSchema, scheduleRowSchema (+1 more)

### Community 36 - "app/layout.tsx"
Cohesion: 0.28
Nodes (6): next-themes, geistMono, geistSans, metadata, RootLayout(), Toaster()

### Community 37 - "ImportQuestions"
Cohesion: 0.39
Nodes (7): previewQuestionImport(), ImportQuestionsPage(), metadata, ImportQuestions(), onFile(), onImport(), toFormData()

### Community 38 - "validators/results.ts"
Cohesion: 0.29
Nodes (5): RESULT_SORTS, id, idParamSchema, ResultsQuery, resultsQuerySchema

### Community 39 - "use-now.ts"
Cohesion: 0.70
Nodes (4): getServerSnapshot(), getSnapshot(), subscribe(), useNow()

## Knowledge Gaps
- **282 isolated node(s):** `plugins`, `$schema`, `style`, `rsc`, `tsx` (+277 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 349 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `requireTeacher()` connect `requireTeacher` to `grades-data.ts`, `tests/actions.ts`, `lib/attendance.ts`, `attendance-data.ts`, `Bosqichlar`, `ImportQuestions`, `next`, `buttonVariants`, `Button`, `guards.ts`, `students/actions.ts`, `time.ts`, `homework/actions.ts`, `students/page.tsx`, `result/[attemptId]/page.tsx`, `results/page.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `package.json`, `lib/attendance.ts`, `buttonVariants`, `students/import.ts`, `Button`, `guards.ts`, `students/actions.ts`, `time.ts`, `attempts.ts`, `lib/grades.ts`, `requireTeacher`, `homework/actions.ts`, `students/page.tsx`, `result/[attemptId]/page.tsx`, `test-runner.tsx`, `results/page.tsx`, `grades-data.ts`, `tests/actions.ts`, `attendance-data.ts`, `app/layout.tsx`, `ImportQuestions`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Why does `Button()` connect `Button` to `ImportQuestions`, `next`, `buttonVariants`, `guards.ts`, `students/page.tsx`, `result/[attemptId]/page.tsx`, `test-runner.tsx`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `requireTeacher()` (e.g. with `Majburiy qoidalar` and `11-bosqich: boshqa guruhga o'tkazish`) actually correct?**
  _`requireTeacher()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `plugins`, `$schema`, `style` to the rest of the system?**
  _282 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08307692307692308 - nodes in this community are weakly interconnected._