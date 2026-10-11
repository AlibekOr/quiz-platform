import { describe, expect, it } from "vitest";
import { defaultHomeworkTitle, homeworkStatus } from "./homework";

describe("homeworkStatus", () => {
  const due = "2026-10-14";

  it("0 dan katta ball — bajarildi", () => {
    expect(homeworkStatus(0.5, due, "2026-10-20")).toBe("DONE");
    expect(homeworkStatus(1, due, "2026-10-10")).toBe("DONE");
  });

  it("0 ball — bajarilmagan (muddatdan oldin ham)", () => {
    expect(homeworkStatus(0, due, "2026-10-10")).toBe("MISSED");
  });

  it("ball yo'q: muddat kunining o'zida kutilmoqda, keyin bajarilmagan", () => {
    expect(homeworkStatus(null, due, "2026-10-14")).toBe("PENDING");
    expect(homeworkStatus(null, due, "2026-10-15")).toBe("MISSED");
  });
});

describe("defaultHomeworkTitle", () => {
  it("dars sanasi bilan", () => {
    expect(defaultHomeworkTitle("2026-10-11")).toBe("Uyga vazifa — 11.10");
  });
});
