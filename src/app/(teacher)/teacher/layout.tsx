import { AppShell } from "@/components/nav/app-shell";
import { getCurrentUser } from "@/lib/auth/guards";

// Layout faqat ko'rinish uchun; har bir sahifa o'zi requireTeacher() chaqiradi
export default async function TeacherLayout({
  children,
}: LayoutProps<"/teacher">) {
  return <AppShell user={await getCurrentUser()}>{children}</AppShell>;
}
