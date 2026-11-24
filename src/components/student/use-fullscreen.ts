"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

// Brauzer to'liq ekranni qo'llamasa (iPhone Safari) — talab qilinmaydi
const getSnapshot = () =>
  !document.fullscreenEnabled || document.fullscreenElement !== null;
const getServerSnapshot = () => true;

/** To'liq ekrandami (yoki brauzer uni qo'llamaydimi). Serverda true — overlay chizilmaydi */
export function useFullscreen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Foydalanuvchi bosgan paytda chaqiriladi (brauzer faqat shunda ruxsat beradi).
 * @returns false — brauzer so'rovni rad etdi
 */
export async function enterFullscreen(): Promise<boolean> {
  if (!document.fullscreenEnabled || document.fullscreenElement) return true;
  try {
    await document.documentElement.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}

export function exitFullscreen(): void {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
