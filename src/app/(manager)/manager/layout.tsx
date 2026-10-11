import { AppShell } from "@/components/nav/app-shell";
import { getCurrentUser } from "@/lib/auth/guards";

// Layout faqat ko'rinish uchun; har bir sahifa o'zi requireManager() chaqiradi
export default async function ManagerLayout({
  children,
}: LayoutProps<"/manager">) {
  return <AppShell user={await getCurrentUser()}>{children}</AppShell>;
}
