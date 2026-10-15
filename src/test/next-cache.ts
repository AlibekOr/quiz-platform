// Vitest'da "next/cache" o'rniga: unstable_cache Next.js so'rovidan tashqarida xato beradi,
// testlarda kesh kerak emas — funksiya to'g'ridan-to'g'ri chaqiriladi
export function unstable_cache<
  T extends (...args: never[]) => Promise<unknown>,
>(fn: T): T {
  return fn;
}

export function revalidateTag(): void {}

export function revalidatePath(): void {}
