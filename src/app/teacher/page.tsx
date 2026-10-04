import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = { title: "O'qituvchi paneli" };

export default async function TeacherPage() {
  const user = await requireTeacher();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">
          O&apos;qituvchi paneli — {user.fullName}
        </h1>
        <LogoutButton />
      </header>
      <p className="text-muted-foreground">
        Guruhlar va o&apos;quvchilar 3-bosqichda qo&apos;shiladi.
      </p>
    </main>
  );
}
