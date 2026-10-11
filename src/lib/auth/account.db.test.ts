import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/profile-data";
import { resetDatabase } from "@/test/db";
import { changePassword, isSessionValid, saveOwnContacts } from "./account";
import { hashPassword, verifyPassword } from "./password";

const OLD = "eski-parol-123";
const NEW = "yangi-parol-456";

async function user(username: string, role: "STUDENT" | "TEACHER" = "STUDENT") {
  return db.user.create({
    data: {
      username,
      fullName: username,
      role,
      passwordHash: await hashPassword(OLD),
    },
  });
}

async function dbUser(id: string) {
  return db.user.findUniqueOrThrow({
    where: { id },
    select: {
      isActive: true,
      archivedAt: true,
      sessionVersion: true,
      passwordHash: true,
    },
  });
}

beforeEach(resetDatabase);

describe("changePassword", () => {
  it("eski sessiyani bekor qiladi, yangi sessiya ishlaydi", async () => {
    const u = await user("ali");
    const oldSession = u.sessionVersion;
    expect(isSessionValid(await dbUser(u.id), oldSession)).toBe(true);

    const result = await changePassword(u.id, OLD, NEW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const after = await dbUser(u.id);
    expect(isSessionValid(after, oldSession)).toBe(false);
    expect(isSessionValid(after, result.sessionVersion)).toBe(true);
    expect(await verifyPassword(NEW, after.passwordHash)).toBe(true);
    expect(await verifyPassword(OLD, after.passwordHash)).toBe(false);
  });

  it("joriy parol noto'g'ri bo'lsa hech narsa o'zgarmaydi", async () => {
    const u = await user("vali");
    const result = await changePassword(u.id, "notogri-parol", NEW);
    expect(result).toEqual({ ok: false, reason: "wrong-password" });

    const after = await dbUser(u.id);
    expect(after.sessionVersion).toBe(u.sessionVersion);
    expect(await verifyPassword(OLD, after.passwordHash)).toBe(true);
  });
});

describe("isSessionValid", () => {
  it("bloklangan yoki arxivlangan user — yaroqsiz", () => {
    const base = { isActive: true, archivedAt: null, sessionVersion: 2 };
    expect(isSessionValid(base, 2)).toBe(true);
    expect(isSessionValid({ ...base, isActive: false }, 2)).toBe(false);
    expect(isSessionValid({ ...base, archivedAt: new Date() }, 2)).toBe(false);
    expect(isSessionValid(null, 0)).toBe(false);
  });
});

describe("saveOwnContacts", () => {
  it("faqat telefon va Telegram yoziladi, ota-ona va izoh saqlanadi", async () => {
    const u = await user("hasan");
    await db.studentProfile.create({
      data: {
        userId: u.id,
        phone: "+998900000000",
        parentName: "Ota",
        parentPhone: "+998911111111",
        note: "O'qituvchi izohi",
      },
    });

    await saveOwnContacts(u.id, {
      phone: "+998901234567",
      telegram: "@hasan_uz",
    });

    const p = await db.studentProfile.findUniqueOrThrow({
      where: { userId: u.id },
    });
    expect(p.phone).toBe("+998901234567");
    expect(p.telegram).toBe("@hasan_uz");
    expect(p.parentName).toBe("Ota");
    expect(p.parentPhone).toBe("+998911111111");
    expect(p.note).toBe("O'qituvchi izohi");
  });

  it("profili yo'q o'quvchiga yangi profil yaratiladi", async () => {
    const u = await user("husan");
    await saveOwnContacts(u.id, { phone: null, telegram: "@husan_uz" });
    const p = await db.studentProfile.findUniqueOrThrow({
      where: { userId: u.id },
    });
    expect(p.telegram).toBe("@husan_uz");
  });
});

describe("getProfile", () => {
  it("o'quvchi o'z kontaktlarini ko'radi, o'qituvchi izohi kirmaydi", async () => {
    const u = await user("olim");
    await db.studentProfile.create({
      data: { userId: u.id, phone: "+998901234567", note: "maxfiy izoh" },
    });
    const profile = await getProfile({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: "STUDENT",
      groupId: null,
      regionId: null,
    });
    expect(profile.kind).toBe("student");
    if (profile.kind !== "student") return;
    expect(profile.contacts?.phone).toBe("+998901234567");
    expect(profile.contacts).not.toHaveProperty("note");
  });
});
