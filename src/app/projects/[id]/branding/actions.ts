"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { brandingSchema } from "@/schemas";
import { sendMail } from "@/lib/mailer";
import { renderBrandedEmail } from "@/lib/branded-email";
import { env } from "@/lib/env";

export interface BrandingState {
  ok?: boolean;
  error?: string;
  message?: string;
}

function parse(formData: FormData) {
  const color = String(formData.get("brandColor") ?? "").trim();
  return brandingSchema.safeParse({
    brandName: formData.get("brandName") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
    brandColor: color.startsWith("#") ? color : `#${color}`,
    senderName: formData.get("senderName") ?? "",
    footerText: formData.get("footerText") ?? "",
    address: formData.get("address") ?? "",
    unsubscribeText: formData.get("unsubscribeText") ?? "",
    socialInstagram: formData.get("socialInstagram") ?? "",
    socialX: formData.get("socialX") ?? "",
    socialLinkedin: formData.get("socialLinkedin") ?? "",
  });
}

export async function saveBrandingAction(
  projectId: string,
  _prev: BrandingState,
  formData: FormData
): Promise<BrandingState> {
  await requireProject(projectId);
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid branding" };
  }
  const data = { ...parsed.data, brandColor: parsed.data.brandColor.toLowerCase() };
  await prisma.branding.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: data,
  });
  revalidatePath(`/projects/${projectId}/branding`);
  return { ok: true, message: "Branding saved." };
}

export async function sendBrandingTestAction(
  projectId: string,
  _prev: BrandingState,
  formData: FormData
): Promise<BrandingState> {
  await requireProject(projectId);
  const to = String(formData.get("testEmail") ?? "").trim();
  if (!to) return { error: "Enter an email address to send the test to." };

  const parsed = parse(formData);
  if (!parsed.success) return { error: "Fix the branding fields first." };

  const smtp = await prisma.smtpConfig.findUnique({ where: { projectId } });
  if (!smtp) return { error: "Configure SMTP in Settings first." };

  const content = `<h1 style="margin:0 0 12px">This is your branded email</h1>
    <p>Every automated email is wrapped in this header, colors, and footer. Change your branding once and all templates update.</p>
    <p><a href="#" style="display:inline-block;background:${parsed.data.brandColor};color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Example button</a></p>`;

  const html = renderBrandedEmail(content, parsed.data, {
    unsubscribeUrl: `${env.appUrl}/u/preview`,
  });

  try {
    await sendMail(smtp, { to, subject: "Branding preview", html });
    return { ok: true, message: `Branded test sent to ${to}.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Send failed" };
  }
}
