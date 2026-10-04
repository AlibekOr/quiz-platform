import bcrypt from "bcryptjs";

const COST = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummyHash: string | undefined;

// User topilmaganda ham bcrypt ishlaydi — javob vaqtidan username mavjudligini bilib bo'lmaydi
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= await bcrypt.hash("dummy-password", COST);
  await bcrypt.compare(password, dummyHash);
  return false;
}
