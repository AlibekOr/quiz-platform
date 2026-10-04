import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "O'qituvchi paneli" };

export default async function TeacherPage() {
  await requireTeacher();

  return (
    <>
      <h1 className="text-2xl font-semibold">Bosh sahifa</h1>
      <p className="text-muted-foreground">
        Umumiy statistika keyingi bosqichlarda qo&apos;shiladi.
      </p>
    </>
  );
}
