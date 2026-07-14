import { prisma } from "@/lib/db";
import { verifySmtp } from "@/lib/mailer";

async function main() {
  const smtp = await prisma.smtpConfig.findFirst({ orderBy: { updatedAt: "desc" } });
  if (!smtp) throw new Error("No SMTP config");
  await verifySmtp(smtp);
  console.log(`SMTP OK: ${smtp.host}:${smtp.port} as ${smtp.username}`);
}

main()
  .catch((e) => {
    console.error("SMTP FAILED:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
