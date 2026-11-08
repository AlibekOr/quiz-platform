import type { Metadata } from "next";
import { BankView } from "@/components/teacher/bank/bank-view";
import { requireTeacherScope } from "@/lib/auth/staff";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Savollar banki" };

// O'qituvchining shaxsiy banki (FEATURES.md, B qism)
export default async function BankPage({
  searchParams,
}: PageProps<"/teacher/bank">) {
  const { user } = await requireTeacherScope();
  // Tanlangan savollarni qo'shish uchun: o'qituvchining o'z testlari
  // (tahrirlash huquqi action'da getTestAccess bilan qayta tekshiriladi)
  const tests = await db.test.findMany({
    where: { OR: [{ createdById: user.id }, { ownerId: user.id }] },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, title: true },
  });
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
        tests={tests}
      />
    </>
  );
}
