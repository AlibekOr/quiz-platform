import type { Metadata } from "next";
import { ParamSelect } from "@/components/common/param-select";
import { BankView } from "@/components/teacher/bank/bank-view";
import { requireAdminScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Savollar banki" };

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// ADMIN: o'qituvchilarning banklari — faqat ko'rish (FEATURES.md, B qism "Huquqlar")
export default async function AdminBankPage({
  searchParams,
}: PageProps<"/admin/bank">) {
  await requireAdminScope();
  const params = await searchParams;
  const teachers = await db.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      _count: { select: { bankQuestions: { where: { archivedAt: null } } } },
    },
  });
  const teacher =
    teachers.find((t) => t.id === param(params.teacher)) ?? teachers[0];

  return (
    <>
      <h1 className="text-2xl font-semibold">Savollar banki</h1>
      {teacher ? (
        <>
          <div className="flex flex-wrap gap-2">
            <ParamSelect
              name="teacher"
              value={teacher.id}
              label="O'qituvchi"
              reset={["topic", "tag", "q"]}
              options={teachers.map((t) => ({
                value: t.id,
                label: `${t.fullName} (${t._count.bankQuestions})`,
              }))}
            />
          </div>
          <BankView
            ownerId={teacher.id}
            params={params}
            action="/admin/bank"
            readOnly
            testHref={null}
            hidden={{ teacher: teacher.id }}
          />
        </>
      ) : (
        <p className="text-muted-foreground">O&apos;qituvchi yo&apos;q.</p>
      )}
    </>
  );
}
