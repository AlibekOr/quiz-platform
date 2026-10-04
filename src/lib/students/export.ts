import ExcelJS from "exceljs";
import {
  PARENT_RELATION_LABELS,
  type ParentRelation,
} from "@/lib/validators/contact";

// Parol va hash hech qachon eksport qilinmaydi — bu yerga faqat quyidagi maydonlar keladi
export type ExportStudent = {
  fullName: string;
  username: string;
  groupName: string | null;
  isActive: boolean;
  profile: {
    phone: string | null;
    telegram: string | null;
    parentName: string | null;
    parentRelation: ParentRelation | null;
    parentPhone: string | null;
    note: string | null;
  } | null;
};

export const EXPORT_HEADERS = [
  "F.I.Sh",
  "Login",
  "Guruh",
  "Holat",
  "Telefon",
  "Telegram",
  "Ota-ona ismi",
  "Kimligi",
  "Ota-ona telefoni",
  "Izoh",
] as const;

export async function buildStudentsWorkbook(
  students: ExportStudent[],
  title: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("O'quvchilar", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { width: 30 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 18 },
    { width: 20 },
    { width: 24 },
    { width: 10 },
    { width: 18 },
    { width: 40 },
  ];
  const header = sheet.addRow([...EXPORT_HEADERS]);
  header.font = { bold: true };

  for (const s of students) {
    const p = s.profile;
    sheet.addRow([
      s.fullName,
      s.username,
      s.groupName,
      s.isActive ? "Faol" : "Bloklangan",
      p?.phone ?? null,
      p?.telegram ?? null,
      p?.parentName ?? null,
      p?.parentRelation ? PARENT_RELATION_LABELS[p.parentRelation] : null,
      p?.parentPhone ?? null,
      p?.note ?? null,
    ]);
  }
  sheet.autoFilter = { from: "A1", to: `J${Math.max(1, students.length + 1)}` };
  workbook.title = title;

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/** Fayl nomi uchun xavfsiz qism: "Frontend-1" -> "Frontend-1", "A/B guruh" -> "A_B_guruh" */
export function fileSafe(name: string): string {
  return (
    name.replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "") || "guruh"
  );
}
