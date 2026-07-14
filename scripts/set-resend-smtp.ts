/**
 * One-off: point a project's SMTP at Resend. Runs INSIDE the app container so it
 * uses the container's own ENCRYPTION_KEY to encrypt the password (the key is
 * never printed). The Resend key is passed via the RESEND_SMTP_PASS env var.
 *
 *   docker compose cp scripts/set-resend-smtp.ts app:/app/scripts/set-resend-smtp.ts
 *   docker compose exec -e RESEND_SMTP_PASS=re_xxx app npx tsx scripts/set-resend-smtp.ts
 */
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

async function main() {
  const pass = process.env.RESEND_SMTP_PASS;
  if (!pass) throw new Error("Set RESEND_SMTP_PASS to the Resend API key");

  const project = process.env.PROJECT_ID
    ? await prisma.project.findUnique({ where: { id: process.env.PROJECT_ID } })
    : await prisma.project.findFirst({ orderBy: { createdAt: "desc" } });
  if (!project) throw new Error("No project found");

  const data = {
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    username: "resend",
    passwordEnc: encrypt(pass),
    fromEmail: "hello@onboarding-freeserp.com",
    fromName: "FreeSERP",
  };

  await prisma.smtpConfig.upsert({
    where: { projectId: project.id },
    create: { projectId: project.id, ...data },
    update: data,
  });

  console.log(`SMTP set to Resend for project "${project.name}" (${project.id})`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
