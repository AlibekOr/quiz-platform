// Sof funksiyalar: test davomida halollik (tab'dan chiqishlar va shubhali natijalar)

/** Shuncha marta boshqa tab/ilovaga chiqilsa, test avtomatik yopiladi */
export const TAB_LEAVE_LIMIT = 3;

/** Chiqish qayd etilgandan keyingi holat */
export function tabLeaveOutcome(leaves: number): {
  close: boolean;
  /** Yopilishgacha qolgan chiqishlar */
  remaining: number;
} {
  return {
    close: leaves >= TAB_LEAVE_LIMIT,
    remaining: Math.max(0, TAB_LEAVE_LIMIT - leaves),
  };
}

/** Bundan yuqori foiz "yuqori natija" hisoblanadi */
const HIGH_PERCENT = 90;
/** Bir savolga o'rtacha shundan kam soniya — juda tez */
const FAST_SEC_PER_QUESTION = 10;
/** Tezlik tekshiruvi uchun eng kam savollar soni */
const FAST_MIN_QUESTIONS = 5;
/** Odatdagi o'rtachadan shuncha foiz yuqori — keskin sakrash */
const JUMP_PERCENT = 30;
/** Odatdagi o'rtacha shuncha boshqa testdan keyin hisoblanadi */
const USUAL_MIN_ATTEMPTS = 3;

export type IntegrityInput = {
  tabLeaves: number;
  closedForLeaving: boolean;
  percent: number;
  durationSec: number;
  questionCount: number;
  /** O'quvchining boshqa testlardagi o'rtacha foizi (yetarli urinish bo'lmasa null) */
  usualPercent: number | null;
};

export type IntegrityFlag = {
  kind: "closed" | "leaves" | "fast" | "jump";
  label: string;
};

export function integrityFlags(input: IntegrityInput): IntegrityFlag[] {
  const flags: IntegrityFlag[] = [];
  if (input.closedForLeaving)
    flags.push({
      kind: "closed",
      label: `Test yopildi: ${input.tabLeaves} marta boshqa oynaga chiqdi`,
    });
  else if (input.tabLeaves > 0)
    flags.push({
      kind: "leaves",
      label: `${input.tabLeaves} marta boshqa oynaga chiqdi`,
    });

  if (
    input.percent >= HIGH_PERCENT &&
    input.questionCount >= FAST_MIN_QUESTIONS &&
    input.durationSec < input.questionCount * FAST_SEC_PER_QUESTION
  )
    flags.push({
      kind: "fast",
      label: `Juda tez: ${input.percent}% natija ${input.durationSec} soniyada`,
    });

  if (
    input.usualPercent !== null &&
    input.percent - input.usualPercent >= JUMP_PERCENT
  )
    flags.push({
      kind: "jump",
      label: `Odatdagidan keskin yuqori: odatda ${input.usualPercent}%, bu safar ${input.percent}%`,
    });
  return flags;
}

/**
 * Boshqa testlardagi birinchi urinishlar foizlaridan o'rtacha; kam bo'lsa null
 * (bir-ikki natija bo'yicha "odatdagi" deb bo'lmaydi)
 */
export function usualPercent(percents: readonly number[]): number | null {
  if (percents.length < USUAL_MIN_ATTEMPTS) return null;
  return Math.round(percents.reduce((s, p) => s + p, 0) / percents.length);
}
