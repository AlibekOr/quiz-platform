import Link from "next/link";
import { TrophyIcon } from "lucide-react";
import { CreateTestButton } from "@/components/teacher/tests/create-test-button";
import { TestStatusBadge } from "@/components/staff/tests/test-status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CurrentUser } from "@/lib/auth/guards";
import { getScope, studentScopeWhere } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { staffBase, testScopeWhere } from "@/lib/tests/access";
import { formatTestWindow } from "@/lib/tests/schedule";
import { getSharedTests, getShareTargets } from "@/lib/tests/sharing";
import {
  BulkShareButton,
  CopySharedButton,
  SelectAllTestsCheckbox,
  SelectTestCheckbox,
  TestSelectionProvider,
} from "@/components/teacher/tests/share-controls";

/** Testlar ro'yxati (o'qituvchi — hammasi, menejer — doiradagi va o'zi yaratganlari) */
export async function TestsListView({ user }: { user: CurrentUser }) {
  const scope = await getScope(user);
  const base = staffBase(user.role);
  const tests = await db.test.findMany({
    where: testScopeWhere(scope),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      ownerId: true,
      durationMin: true,
      isActive: true,
      startsAt: true,
      endsAt: true,
      groups: { select: { name: true }, orderBy: { name: "asc" } },
      // Menejer uchun urinishlar soni ham faqat doiradagi o'quvchilar bo'yicha
      _count: {
        select: {
          questions: true,
          attempts: { where: { user: studentScopeWhere(scope) } },
        },
      },
    },
  });
  const now = new Date();
  // O'qituvchiga ulashilganlar — faqat nusxa olish uchun (savollari ko'rsatilmaydi)
  const isTeacher = user.role === "TEACHER";
  const shared = isTeacher ? await getSharedTests(user.id) : [];
  // Bir yo'la ulashish — faqat o'qituvchining o'z testlari
  const shareTargets = isTeacher ? await getShareTargets(user.id) : null;
  const ownedIds = isTeacher
    ? tests.filter((t) => t.ownerId === user.id).map((t) => t.id)
    : [];
  const selectable = ownedIds.length > 0;

  return (
    <TestSelectionProvider ids={ownedIds}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Testlar</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            prefetch={false}
            href={`${base}/tests/leaderboard`}
            className={buttonVariants({ variant: "outline" })}
          >
            <TrophyIcon />
            Test reytingi
          </Link>
          {selectable && shareTargets && (
            <BulkShareButton targets={shareTargets} />
          )}
          <CreateTestButton />
        </div>
      </div>

      {tests.length === 0 ? (
        <p className="text-muted-foreground">
          Hali test yo&apos;q. Birinchi testni yarating.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable && (
                  <TableHead className="w-8">
                    <SelectAllTestsCheckbox />
                  </TableHead>
                )}
                <TableHead className="text-muted-foreground w-10">№</TableHead>
                <TableHead>Nomi</TableHead>
                <TableHead>Guruhlar</TableHead>
                <TableHead className="text-right">Savollar</TableHead>
                <TableHead className="text-right">Vaqt</TableHead>
                <TableHead className="text-right">Urinishlar</TableHead>
                <TableHead>Holat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((t, i) => (
                <TableRow key={t.id}>
                  {selectable && (
                    <TableCell>
                      {t.ownerId === user.id && (
                        <SelectTestCheckbox testId={t.id} title={t.title} />
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      prefetch={false}
                      href={`${base}/tests/${t.id}`}
                      className="hover:underline"
                    >
                      {t.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.groups.length > 0
                      ? t.groups.map((g) => g.name).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {t._count.questions}
                  </TableCell>
                  <TableCell className="text-right">
                    {t.durationMin} daq
                  </TableCell>
                  <TableCell className="text-right">
                    {t._count.attempts}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <TestStatusBadge test={t} now={now} />
                      {formatTestWindow(t, now) && (
                        <span className="text-muted-foreground text-xs">
                          {formatTestWindow(t, now)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {shared.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold">Menga ulashilgan</h2>
          <p className="text-muted-foreground text-sm">
            Boshqa o&apos;qituvchilar ulashgan va siz ishlaydigan menejerlar
            yaratgan testlar. Nusxa olsangiz, test sizniki bo&apos;ladi:
            tahrirlab, guruhlaringizga berasiz.
          </p>
          <ul className="divide-y rounded-lg border text-sm">
            {shared.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3"
              >
                <span>
                  <span className="font-medium">{t.title}</span>
                  <span className="text-muted-foreground block text-xs">
                    {t.author} · {t.questionCount} ta savol
                  </span>
                </span>
                <CopySharedButton testId={t.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </TestSelectionProvider>
  );
}
