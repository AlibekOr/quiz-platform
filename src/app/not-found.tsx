import type { Metadata } from "next";
import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { StatusMessage } from "@/components/common/status-message";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sahifa topilmadi" };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col p-4">
      <StatusMessage
        icon={SearchXIcon}
        title="Sahifa topilmadi"
        description="Siz izlagan sahifa mavjud emas yoki uni ko'rishga ruxsatingiz yo'q."
      >
        <Link href="/" className={buttonVariants()}>
          Bosh sahifaga qaytish
        </Link>
      </StatusMessage>
    </main>
  );
}
