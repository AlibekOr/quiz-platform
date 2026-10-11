import { redirect } from "next/navigation";

// Eski manzil: profil endi barcha rollar uchun umumiy /profile sahifasida
export default function AccountRedirect() {
  redirect("/profile");
}
