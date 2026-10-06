import type { ParentRelation } from "@/lib/validators/contact";

export type GroupOption = { id: string; name: string };

/** Faqat o'qituvchi sahifalarida ishlatiladi (aloqa ma'lumotlari bor) */
export type StudentRow = {
  id: string;
  fullName: string;
  username: string;
  isActive: boolean;
  archived: boolean;
  groupId: string | null;
  groupName: string | null;
  profile: {
    phone: string | null;
    telegram: string | null;
    parentName: string | null;
    parentRelation: ParentRelation | null;
    parentPhone: string | null;
    note: string | null;
  } | null;
};
