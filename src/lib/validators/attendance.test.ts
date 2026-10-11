import { describe, expect, it } from "vitest";
import { attendanceFormSchema, scheduleFormSchema } from "./attendance";

const week = (
  overrides: Record<number, { startTime: string; endTime: string }>,
) =>
  Array.from({ length: 7 }, (_, i) => ({
    weekday: i + 1,
    enabled: i + 1 in overrides,
    startTime: overrides[i + 1]?.startTime ?? "",
    endTime: overrides[i + 1]?.endTime ?? "",
  }));

describe("scheduleFormSchema", () => {
  it("o'chiq kunlar vaqtsiz bo'lishi mumkin", () => {
    expect(
      scheduleFormSchema.safeParse({
        days: week({ 1: { startTime: "14:00", endTime: "16:00" } }),
      }).success,
    ).toBe(true);
  });

  it("noto'g'ri yoki teskari vaqt", () => {
    const bad = scheduleFormSchema.safeParse({
      days: week({
        3: { startTime: "16:00", endTime: "14:00" },
        5: { startTime: "25:00", endTime: "" },
      }),
    });
    expect(bad.success).toBe(false);
    const paths = bad.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual([
      "days.2.endTime",
      "days.4.startTime",
      "days.4.endTime",
    ]);
  });
});

describe("attendanceFormSchema", () => {
  it("hamma belgilangan bo'lishi kerak", () => {
    const result = attendanceFormSchema.safeParse({
      topic: "",
      records: [
        { studentId: "a", status: "PRESENT", note: "", oral: "" },
        { studentId: "b", status: "", note: "", oral: "" },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues[0].message).toBe("1 ta o'quvchi belgilanmagan");
  });

  it("bo'sh mavzu va izoh null bo'ladi", () => {
    const result = attendanceFormSchema.parse({
      topic: "  ",
      records: [{ studentId: "a", status: "LATE", note: " ", oral: "" }],
    });
    expect(result).toEqual({
      topic: null,
      records: [{ studentId: "a", status: "LATE", note: null, oral: null }],
    });
  });

  it("og'zaki ball: 0 / 0.5 / 1, kelmaganga qo'yilmaydi", () => {
    const ok = attendanceFormSchema.parse({
      topic: "",
      records: [
        { studentId: "a", status: "PRESENT", note: "", oral: "0.5" },
        { studentId: "b", status: "LATE", note: "", oral: "1" },
      ],
    });
    expect(ok.records.map((r) => r.oral)).toEqual([0.5, 1]);

    const absent = attendanceFormSchema.safeParse({
      topic: "",
      records: [{ studentId: "a", status: "ABSENT", note: "", oral: "1" }],
    });
    expect(absent.success).toBe(false);
    expect(absent.error!.issues[0].path).toEqual(["records", 0, "oral"]);

    const excused = attendanceFormSchema.safeParse({
      topic: "",
      records: [{ studentId: "a", status: "EXCUSED", note: "", oral: "1" }],
    });
    expect(excused.success).toBe(false);
    expect(
      attendanceFormSchema.safeParse({
        topic: "",
        records: [{ studentId: "a", status: "EXCUSED", note: "", oral: "" }],
      }).success,
    ).toBe(true);

    const bad = attendanceFormSchema.safeParse({
      topic: "",
      records: [{ studentId: "a", status: "PRESENT", note: "", oral: "2" }],
    });
    expect(bad.success).toBe(false);
  });
});
