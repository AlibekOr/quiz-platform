import { AppShell } from "@/components/nav/app-shell";
import { getCurrentUser } from "@/lib/auth/guards";

// Layout faqat ko'rinish uchun; har bir sahifa o'zi requireStudent()/requireUser() chaqiradi.
// Reyting sahifalarini o'qituvchi va menejer ham ochadi — menyu rolga qarab (AppShell)
export default async function StudentLayout({ children }: LayoutProps<"/">) {
  return <AppShell user={await getCurrentUser()}>{children}</AppShell>;
}
