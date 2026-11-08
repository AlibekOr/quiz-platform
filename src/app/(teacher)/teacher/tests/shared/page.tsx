import type { Metadata } from "next";
import Link from "next/link";
import { SharedTestsList } from "@/components/teacher/tests/shared-tests-list";
import { requireTeacherScope } from "@/lib/auth/staff";
import { getSharedTests, type SharedView } from "@/lib/tests/sharing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Menga ulashilgan" };

// Boshqa o'qituvchilar ulashgan va menejerlar yaratgan testlar: qabul qilinsa nusxasi
// "Barcha testlar"ga tushadi, olib tashlansa — "Olib tashlanganlar"ga
export default async function SharedTestsPage({
  searchParams,
}: PageProps<"/teacher/tests/shared">) {
  const { user } = await requireTeacherScope();
  const view: SharedView =
    (await searchParams).view === "hidden" ? "hidden" : "new";
  const tests = await getSharedTests(user.id, view);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Menga ulashilgan</h1>
        <p className="text-muted-foreground text-sm">
          Qo&apos;shgan testingiz nusxasi sizniki bo&apos;ladi: tahrirlab,
          guruhlaringizga berasiz. Keraksizini olib tashlang.
        </p>
      </div>
      <nav className="flex gap-1 text-sm">
        {(
          [
            ["new", "Yangi", "/teacher/tests/shared"],
            [
              "hidden",
              "Olib tashlanganlar",
              "/teacher/tests/shared?view=hidden",
            ],
          ] as const
        ).map(([value, label, href]) => (
          <Link
            key={value}
            prefetch={false}
            href={href}
            aria-current={view === value ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5",
              view === value
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
      <SharedTestsList key={view} tests={tests} view={view} />
    </>
  );
}
