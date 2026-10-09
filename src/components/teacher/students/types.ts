import type { ParentRelation } from "@/lib/validators/contact";

export type GroupOption = { id: string; name: string };

/** Kim ko'ryapti: menejerda arxivlash, o'chirish va guruhdan chiqarish yo'q */
export type StaffVariant = "teacher" | "manager";

/** Faqat o'qituvchi sahifalarida ishlatiladi (aloqa ma'lumotlari bor) */
export type StudentRow = {
  id: string;
  fullName: string;
  username: string;
  isActive: boolean;
  archived: boolean;
  groupId: string | null;
  groupName: string | null;
  /** Menejerning o'chirish so'rovi kutilmoqda */
  deletionPending?: boolean;
  profile: {
    phone: string | null;
    telegram: string | null;
    parentName: string | null;
    parentRelation: ParentRelation | null;
    parentPhone: string | null;
    note: string | null;
  } | null;
};
