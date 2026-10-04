"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveAnswer } from "@/app/(student)/test/actions";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const RETRY_MS = 3000;

/**
 * Javoblarni ketma-ket (navbat bilan) saqlaydi. Har bir savol uchun faqat oxirgi qiymat yuboriladi;
 * xato bo'lsa saqlanmagan qiymat qoladi va 3 soniyadan keyin qayta urinadi.
 */
export function useAutosave(attemptId: string, onExpired: () => void) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const pending = useRef(new Map<string, string[]>());
  const queue = useRef<Promise<void>>(Promise.resolve());
  const onExpiredRef = useRef(onExpired);
  useEffect(() => {
    onExpiredRef.current = onExpired;
  });

  const saveOne = useCallback(
    async (questionId: string) => {
      const value = pending.current.get(questionId);
      if (value === undefined) return;
      try {
        const result = await saveAnswer(attemptId, questionId, value);
        if (result.ok) {
          // Saqlash paytida yangi qiymat kelgan bo'lsa, uni o'chirmaymiz
          if (pending.current.get(questionId) === value)
            pending.current.delete(questionId);
        } else if (result.expired) {
          pending.current.clear();
          onExpiredRef.current();
          return;
        } else {
          pending.current.delete(questionId);
          setStatus("error");
          return;
        }
      } catch {
        setStatus("error");
        return;
      }
      if (pending.current.size === 0) setStatus("saved");
    },
    [attemptId],
  );

  const enqueue = useCallback(
    (questionId: string) => {
      queue.current = queue.current.then(() => saveOne(questionId));
      return queue.current;
    },
    [saveOne],
  );

  const save = useCallback(
    (questionId: string, optionIds: string[]) => {
      pending.current.set(questionId, optionIds);
      setStatus("saving");
      void enqueue(questionId);
    },
    [enqueue],
  );

  /** Saqlanmagan barcha javoblarni yuboradi (topshirishdan oldin) */
  const flush = useCallback(async () => {
    for (const questionId of [...pending.current.keys()])
      void enqueue(questionId);
    await queue.current;
    return pending.current.size === 0;
  }, [enqueue]);

  useEffect(() => {
    if (status !== "error") return;
    const timer = setTimeout(() => {
      if (pending.current.size > 0) {
        setStatus("saving");
        void flush();
      }
    }, RETRY_MS);
    return () => clearTimeout(timer);
  }, [status, flush]);

  return { status, save, flush };
}
