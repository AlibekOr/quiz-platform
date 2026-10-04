import "server-only";

/**
 * O'quvchi aloqa ma'lumotlari uchun select. FAQAT o'qituvchi sahifalari va
 * o'qituvchi API'lari ishlatadi (CLAUDE.md, 10-qoida).
 */
export const teacherProfileSelect = {
  phone: true,
  telegram: true,
  parentName: true,
  parentRelation: true,
  parentPhone: true,
  note: true,
} as const;
