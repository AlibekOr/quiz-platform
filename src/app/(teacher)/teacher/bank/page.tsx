import type { Metadata } from "next";
import { BankView } from "@/components/teacher/bank/bank-view";
import { requireTeacherScope } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Savollar banki" };

// O'qituvchining shaxsiy banki (FEATURES.md, B qism)
export default async function BankPage({
  searchParams,
}: PageProps<"/teacher/bank">) {
  const { user } = await requireTeacherScope();
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Savollar banki</h1>
        <p className="text-muted-foreground text-sm">
          Savollaringiz bir joyda: testga qo&apos;shilganda nusxalanadi, shuning
          uchun bankdagi o&apos;zgarish eski testlar va natijalarga ta&apos;sir
          qilmaydi.
        </p>
      </div>
      <BankView
        ownerId={user.id}
        params={await searchParams}
        action="/teacher/bank"
        readOnly={false}
        testHref="/teacher/tests"
      />
    </>
  );
}
