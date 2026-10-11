import { AppShell } from "@/components/nav/app-shell";
import { getCurrentUser } from "@/lib/auth/guards";

// Barcha rollar uchun umumiy sahifalar (/profile): menyu rolga qarab.
// Layout faqat ko'rinish uchun; sahifa o'zi requireUser() chaqiradi
export default async function AccountLayout({ children }: LayoutProps<"/">) {
  return <AppShell user={await getCurrentUser()}>{children}</AppShell>;
}
