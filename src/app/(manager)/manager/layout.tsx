import { StaffShell } from "@/components/teacher/staff-shell";
import { getCurrentUser } from "@/lib/auth/guards";

// Layout faqat ko'rinish uchun; har bir sahifa o'zi requireManager() chaqiradi
export default async function ManagerLayout({
  children,
}: LayoutProps<"/manager">) {
  const user = await getCurrentUser();

  return (
    <StaffShell
      variant="manager"
      title="Menejer paneli"
      userName={user?.fullName}
    >
      {children}
    </StaffShell>
  );
}
