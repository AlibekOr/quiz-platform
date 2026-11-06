import { AppShell } from "@/components/nav/app-shell";
import { getCurrentUser } from "@/lib/auth/guards";

// Layout faqat ko'rinish uchun; har bir sahifa o'zi requireAdmin() chaqiradi
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AppShell user={await getCurrentUser()}>{children}</AppShell>;
}
