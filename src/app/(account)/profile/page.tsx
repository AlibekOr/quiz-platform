import type { Metadata } from "next";
import { SemesterCard } from "@/components/grades/semester-card";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { ContactsForm } from "@/components/profile/contacts-form";
import { NameForm } from "@/components/profile/name-form";
import { requireUser } from "@/lib/auth/guards";
import type { Role } from "@/lib/auth/jwt";
import { getProfile, type Profile } from "@/lib/profile-data";
import { PARENT_RELATION_LABELS } from "@/lib/validators/contact";

export const metadata: Metadata = { title: "Profil" };

const ROLE_LABEL: Record<Role, string> = {
  TEACHER: "O'qituvchi",
  MANAGER: "Menejer",
  STUDENT: "O'quvchi",
};

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="text-muted-foreground w-40 shrink-0 text-sm">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
    </div>
  );
}

function StudentSections({
  profile,
}: {
  profile: Extract<Profile, { kind: "student" }>;
}) {
  const c = profile.contacts;
  const att = profile.attendance;
  const me = profile.semester?.students[0];
  return (
    <>
      {profile.semester && me && (
        <SemesterCard data={profile.semester} student={me} />
      )}

      <Section
        title="Aloqa"
        hint="Telefon +998XXXXXXXXX ko'rinishida saqlanadi. Bu ma'lumotni faqat o'qituvchi va menejer ko'radi."
      >
        <ContactsForm phone={c?.phone ?? null} telegram={c?.telegram ?? null} />
      </Section>

      <Section
        title="Ota-ona"
        hint="O'zgartirish kerak bo'lsa, o'qituvchingizga ayting."
      >
        <dl className="flex flex-col gap-2">
          <Row label="Ismi" value={c?.parentName} />
          <Row
            label="Kim"
            value={
              c?.parentRelation && PARENT_RELATION_LABELS[c.parentRelation]
            }
          />
          <Row
            label="Telefon"
            value={
              c?.parentPhone && (
                <a href={`tel:${c.parentPhone}`} className="hover:underline">
                  {c.parentPhone}
                </a>
              )
            }
          />
        </dl>
      </Section>

      <Section title="Davomat">
        {att.total === 0 ? (
          <p className="text-muted-foreground text-sm">
            Hali davomat belgilanmagan.
          </p>
        ) : (
          <p className="text-sm">
            <b className="text-lg tabular-nums">{att.percent}%</b>{" "}
            <span className="text-muted-foreground">
              · {att.present} ta keldi, {att.absent} ta kelmadi
              {att.late > 0 && `, ${att.late} marta kechikdi`}
            </span>
          </p>
        )}
      </Section>
    </>
  );
}

function ManagerSection({
  profile,
}: {
  profile: Extract<Profile, { kind: "manager" }>;
}) {
  return (
    <Section
      title="Doira"
      hint="Siz shu guruhlarning o'quvchilari bilan ishlaysiz."
    >
      <dl className="flex flex-col gap-2">
        <Row label="Region" value={profile.region?.name} />
        <Row
          label="Region guruhlari"
          value={profile.region?.groups.join(", ") || null}
        />
        <Row
          label="Qo'shimcha guruhlar"
          value={profile.extraGroups.join(", ") || null}
        />
      </dl>
    </Section>
  );
}

// Har kim faqat o'z profilini ko'radi: foydalanuvchi sessiyadan olinadi
export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Profil</h1>
        <p className="text-muted-foreground text-sm">
          {ROLE_LABEL[profile.role]} · login: {profile.username}
        </p>
      </div>

      <Section title="Shaxsiy ma'lumotlar">
        {profile.kind === "teacher" ? (
          <NameForm fullName={profile.fullName} />
        ) : (
          <dl className="flex flex-col gap-2">
            <Row label="Ism familiya" value={profile.fullName} />
            {profile.kind === "student" && (
              <Row label="Guruh" value={profile.group} />
            )}
          </dl>
        )}
      </Section>

      {profile.kind === "student" && <StudentSections profile={profile} />}
      {profile.kind === "manager" && <ManagerSection profile={profile} />}

      <Section
        title="Parolni o'zgartirish"
        hint="Yangi parol kamida 8 belgi. O'zgartirgandan keyin boshqa qurilmalardan chiqib ketasiz, bu qurilmada esa qolasiz."
      >
        <ChangePasswordForm />
      </Section>
    </>
  );
}
