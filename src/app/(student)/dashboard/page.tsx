import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/logout-button";

export const metadata: Metadata = { title: "Testlarim" };

export default async function DashboardPage() {
  const user = await requireStudent();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Salom, {user.fullName}</h1>
        <LogoutButton />
      </header>
      <p className="text-muted-foreground">
        Testlar ro&apos;yxati 5-bosqichda qo&apos;shiladi.
      </p>
    </main>
  );
}
