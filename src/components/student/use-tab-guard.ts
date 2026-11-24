"use client";

import { useEffect, useRef } from "react";
import {
  reportTabLeave,
  type TabLeaveResult,
} from "@/app/(student)/test/actions";

/**
 * Test oynasidan chiqishni (boshqa tab, ilova yoki oyna) serverga yuboradi. Bitta chiqish —
 * oyna yashiringan yoki fokusni yo'qotganidan qaytgunicha (blur va hidden birga bir marta)
 */
export function useTabGuard(
  attemptId: string,
  {
    active,
    onResult,
  }: {
    /** false bo'lsa (topshirilmoqda) chiqishlar hisoblanmaydi */
    active: boolean;
    onResult: (result: TabLeaveResult) => void;
  },
) {
  const activeRef = useRef(active);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    activeRef.current = active;
    onResultRef.current = onResult;
  });

  useEffect(() => {
    let away = false;
    // Tarmoq xatosi bilan yuborilmagan chiqishlar: qaytganda qayta yuboriladi
    let unsent = 0;

    function send() {
      reportTabLeave(attemptId).then(
        (result) => onResultRef.current(result),
        () => {
          unsent++;
        },
      );
    }

    function leave() {
      if (away || !activeRef.current) return;
      away = true;
      send();
    }

    function back() {
      if (document.visibilityState !== "visible" || !document.hasFocus())
        return;
      away = false;
      for (; unsent > 0 && activeRef.current; unsent--) send();
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") leave();
      else back();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", leave);
    window.addEventListener("focus", back);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", back);
    };
  }, [attemptId]);
}
