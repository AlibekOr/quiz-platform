import type { Metadata } from "next";
import { RiskSettingsForm } from "@/components/risk/risk-settings-form";
import { requireTeacherScope } from "@/lib/auth/staff";
import { getRiskSettings } from "@/lib/risk-data";

export const metadata: Metadata = { title: "Xavf sozlamalari" };

// Sozlamalar → Xavf sozlamalari: har signal uchun yoqish/o'chirish va chegaralar
export default async function RiskSettingsPage() {
  const { user } = await requireTeacherScope();
  const s = await getRiskSettings(user.id);
  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Xavf sozlamalari</h1>
        <p className="text-muted-foreground text-sm">
          2 va undan ko&apos;p signal — Yuqori, bitta — O&apos;rta. Ball
          sur&apos;ati semestr oxiriga yaqin yolg&apos;iz o&apos;zi ham Yuqori.
        </p>
      </div>
      <RiskSettingsForm
        initial={{
          absencesEnabled: s.consecutiveAbsences.enabled,
          absencesMin: s.consecutiveAbsences.min,
          attendanceEnabled: s.lowAttendance.enabled,
          attendanceBelow: s.lowAttendance.belowPercent,
          attendanceMinLessons: s.lowAttendance.minLessons,
          missedEnabled: s.missedAssignments.enabled,
          missedLastN: s.missedAssignments.lastN,
          missedMin: s.missedAssignments.minMissed,
          paceEnabled: s.scorePace.enabled,
          paceRatio: s.scorePace.ratio,
          paceGraceDays: s.scorePace.graceDays,
          paceHighAfter: s.scorePace.highAfter,
          penaltiesEnabled: s.penalties.enabled,
          penaltiesWindowDays: s.penalties.windowDays,
          penaltiesMin: s.penalties.minPoints,
        }}
      />
    </>
  );
}
