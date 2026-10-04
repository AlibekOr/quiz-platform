import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { homePathFor } from "@/lib/auth/jwt";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Kirish" };

export default async function LoginPage() {
  // Proxy emas, shu yerda: bloklangan user'ning eski cookie'si redirect sikliga olib kelmaydi
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Kirish</CardTitle>
          <CardDescription>
            O&apos;qituvchi bergan login va parolni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
