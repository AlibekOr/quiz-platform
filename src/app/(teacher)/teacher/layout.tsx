import { StaffShell } from "@/components/teacher/staff-shell";
import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";

// Layout faqat ko'rinish uchun; har bir sahifa o'zi requireTeacher() chaqiradi
export default async function TeacherLayout({
  children,
}: LayoutProps<"/teacher">) {
  const user = await getCurrentUser();
  const pending =
    user?.role === "TEACHER"
      ? await db.deletionRequest.count({ where: { status: "PENDING" } })
      : 0;

  return (
    <StaffShell
      variant="teacher"
      title="Test platformasi"
      userName={user?.fullName}
      badges={{ "/teacher/requests": pending }}
    >
      {children}
    </StaffShell>
  );
}
