// Guruh kodi (ROLES-PLAN.md, §5): REGION + O'QITUVCHI + "-" + seq + "-" + NOM.
//   Shomanay, Orakbaev Alibek, 1, "Shomanay 135 16:00" → SHOA-1-SH
// seq butun loyiha bo'yicha (takrorlanmaydi). Kod bir marta yoziladi va o'zgarmaydi.
// Sof funksiyalar — testlar bilan.

/** O'zbekcha apostrof va uning o'rnida yoziladigan belgilar: o', g', ʻ, ʼ, ‘, ’, ` */
const APOSTROPHES = /['ʻʼ‘’`]/g;

/** O'zbek lotin alifbosida ikki belgili bitta harflar */
const DIGRAPHS = ["SH", "CH"];

/**
 * So'zning birinchi harfi (katta): "Shomanay" → "SH", "Xojeli" → "X", "O'zbek" → "O".
 * Harf yoki raqam bo'lmagan belgilar o'tkazib yuboriladi
 */
export function initialOf(word: string): string {
  const clean = word
    .replace(APOSTROPHES, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .toUpperCase();
  if (!clean) return "";
  const two = clean.slice(0, 2);
  return DIGRAPHS.includes(two) ? two : clean.slice(0, 1);
}

function words(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => initialOf(w) !== "");
}

/** Birinchi so'zning harfi: "Shomanay tumani" → "SH" */
export function firstInitial(text: string): string {
  const [first] = words(text);
  return first ? initialOf(first) : "";
}

/** Familiya va ism harflari: "Orakbaev Alibek Sagindikovich" → "OA" */
export function personInitials(fullName: string): string {
  return words(fullName).slice(0, 2).map(initialOf).join("");
}

export function groupCode(input: {
  regionName: string;
  teacherFullName: string;
  seq: number;
  groupName: string;
}): string {
  return `${firstInitial(input.regionName)}${personInitials(input.teacherFullName)}-${input.seq}-${firstInitial(input.groupName)}`;
}
