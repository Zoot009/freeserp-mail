/**
 * Reset a user's password.
 *   RESET_EMAIL=x@y.com RESET_PASSWORD=newpass DATABASE_URL=... npx tsx scripts/reset-password.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.RESET_EMAIL ?? "").toLowerCase();
  const password = process.env.RESET_PASSWORD ?? "";
  if (!email || password.length < 8) throw new Error("Need RESET_EMAIL and RESET_PASSWORD (8+ chars)");

  const hash = await bcrypt.hash(password, 12);
  const res = await prisma.user.updateMany({ where: { email }, data: { passwordHash: hash } });
  console.log(res.count === 1 ? `Password reset for ${email}` : `No user found: ${email}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
