"use client";

import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";
import { StatusMessage } from "@/components/common/status-message";
import { Button, buttonVariants } from "@/components/ui/button";

/** Segment error.tsx fayllari uchun: xabar, qayta urinish va bosh sahifaga havola */
export function ErrorView({
  error,
  retry,
  homeHref,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref: string;
}) {
  return (
    <StatusMessage
      icon={TriangleAlertIcon}
      title="Nimadir xato ketdi"
      description={
        <>
          Sahifani yuklab bo&apos;lmadi. Internet aloqasini tekshirib, qayta
          urinib ko&apos;ring.
          {error.digest && (
            <span className="mt-2 block font-mono text-xs">
              Xato kodi: {error.digest}
            </span>
          )}
        </>
      }
    >
      <Button onClick={() => retry()}>Qayta urinish</Button>
      <Link href={homeHref} className={buttonVariants({ variant: "outline" })}>
        Bosh sahifa
      </Link>
    </StatusMessage>
  );
}
