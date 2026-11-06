// Har bir yangi o'qituvchiga nusxalanadigan namunaviy jarima shablonlari (keyin o'zgartiradi).
// Sof modul: seed (prisma/seed.ts) ham ishlatadi

export const DEFAULT_PENALTY_TYPES = [
  { name: "Darsga sababsiz kelmaslik", defaultPoints: 2 },
  { name: "Uyga vazifani ko'chirish", defaultPoints: 2 },
  { name: "Darsda tartibni buzish", defaultPoints: 1 },
  { name: "Darsga kechikish", defaultPoints: 1 },
] as const;
