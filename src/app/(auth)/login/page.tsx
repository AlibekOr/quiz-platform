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
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/login" },
  robots: { index: true, follow: false },
};

export default async function LoginPage() {
  // Proxy emas, shu yerda: bloklangan user'ning eski cookie'si redirect sikliga olib kelmaydi
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="flex max-w-sm flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold">{SITE_NAME}</h1>
        <p className="text-muted-foreground text-sm">
          O&apos;quv markaz o&apos;quvchilari uchun onlayn test platformasi
        </p>
      </div>
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
