import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/teacher/account/change-password-form";
import { ProfileForm } from "@/components/teacher/account/profile-form";
import { requireTeacher } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Profil" };

export default async function AccountPage() {
  const teacher = await requireTeacher();

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Profil</h1>
        <p className="text-muted-foreground text-sm">
          login: {teacher.username}
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <div>
          <h2 className="font-semibold">Shaxsiy ma&apos;lumotlar</h2>
          <p className="text-muted-foreground text-sm">
            Ism familiyangiz panel sarlavhasida ko&apos;rinadi.
          </p>
        </div>
        <ProfileForm fullName={teacher.fullName} />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <div>
          <h2 className="font-semibold">Parolni o&apos;zgartirish</h2>
          <p className="text-muted-foreground text-sm">
            Yangi parol kamida 8 belgi. O&apos;zgartirgandan keyin boshqa
            qurilmalardan chiqib ketasiz, bu qurilmada esa qolasiz.
          </p>
        </div>
        <ChangePasswordForm />
      </section>
    </>
  );
}
