"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { generateApiKey } from "@/lib/apikey";
import { encrypt } from "@/lib/crypto";
import { smtpSchema } from "@/schemas";
import { sendMail, verifySmtp } from "@/lib/mailer";

export interface ApiKeyState {
  rawKey?: string;
  error?: string;
}

export async function createApiKeyAction(
  projectId: string,
  _prev: ApiKeyState,
  formData: FormData
): Promise<ApiKeyState> {
  await requireProject(projectId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const { raw, hash, prefix } = generateApiKey();
  await prisma.apiKey.create({
    data: { projectId, name, keyHash: hash, prefix },
  });
  revalidatePath(`/projects/${projectId}/settings`);
  return { rawKey: raw };
}

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const keyId = String(formData.get("keyId"));
  await requireProject(projectId);
  await prisma.apiKey.updateMany({
    where: { id: keyId, projectId },
    data: { revokedAt: new Date() },
  });
  revalidatePath(`/projects/${projectId}/settings`);
}

export interface SmtpState {
  ok?: boolean;
  error?: string;
  message?: string;
}

async function buildSmtpData(projectId: string, formData: FormData) {
  const parsed = smtpSchema.safeParse({
    host: formData.get("host"),
    port: formData.get("port"),
    secure: formData.get("secure") === "on" || formData.get("secure") === "true",
    username: formData.get("username") ?? "",
    password: formData.get("password") ?? "",
    fromEmail: formData.get("fromEmail"),
    fromName: formData.get("fromName") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid SMTP settings" };
  }

  const existing = await prisma.smtpConfig.findUnique({ where: { projectId } });
  // Blank password field means "keep the existing one" (or no password at all
  // for unauthenticated servers like MailHog — store an empty string, never
  // an encrypted empty string).
  const passwordEnc = parsed.data.password
    ? encrypt(parsed.data.password)
    : existing?.passwordEnc ?? "";

  return {
    data: {
      host: parsed.data.host,
      port: parsed.data.port,
      secure: parsed.data.secure,
      username: parsed.data.username,
      passwordEnc,
      fromEmail: parsed.data.fromEmail,
      fromName: parsed.data.fromName,
    },
  };
}

export async function saveSmtpAction(
  projectId: string,
  _prev: SmtpState,
  formData: FormData
): Promise<SmtpState> {
  await requireProject(projectId);
  const built = await buildSmtpData(projectId, formData);
  if ("error" in built) return { error: built.error };

  await prisma.smtpConfig.upsert({
    where: { projectId },
    create: { projectId, ...built.data },
    update: built.data,
  });
  revalidatePath(`/projects/${projectId}/settings`);
  return { ok: true, message: "SMTP settings saved." };
}

export async function testSmtpAction(
  projectId: string,
  _prev: SmtpState,
  formData: FormData
): Promise<SmtpState> {
  await requireProject(projectId);
  const built = await buildSmtpData(projectId, formData);
  if ("error" in built) return { error: built.error };

  const config = {
    id: "test",
    projectId,
    updatedAt: new Date(),
    ...built.data,
  };

  try {
    await verifySmtp(config);
    await sendMail(config, {
      to: config.fromEmail,
      subject: "SMTP test — Email Automation Platform",
      html: "<p>Your SMTP configuration works! 🎉</p>",
      text: "Your SMTP configuration works!",
    });
    return { ok: true, message: `Test email sent to ${config.fromEmail}.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "SMTP test failed" };
  }
}
