import nodemailer, { type Transporter } from "nodemailer";
import type { SmtpConfig } from "@prisma/client";
import { decrypt } from "./crypto";

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function resolvePassword(passwordEnc: string): string {
  if (!passwordEnc) return "";
  try {
    return decrypt(passwordEnc);
  } catch {
    // Tolerate legacy/empty payloads rather than failing the whole send.
    return "";
  }
}

export function buildTransport(config: SmtpConfig): Transporter {
  const pass = resolvePassword(config.passwordEnc);
  // Only authenticate when there's an actual username or password. Test servers
  // like MailHog accept unauthenticated mail on port 1025.
  const useAuth = Boolean(config.username || pass);
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: useAuth ? { user: config.username, pass } : undefined,
  });
}

function fromHeader(config: SmtpConfig): string {
  return config.fromName
    ? `"${config.fromName}" <${config.fromEmail}>`
    : config.fromEmail;
}

export async function sendMail(
  config: SmtpConfig,
  args: SendArgs
): Promise<{ messageId: string }> {
  const transport = buildTransport(config);
  const info = await transport.sendMail({
    from: fromHeader(config),
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  return { messageId: info.messageId };
}

/** Verify SMTP credentials without sending (used by the settings screen). */
export async function verifySmtp(config: SmtpConfig): Promise<void> {
  const transport = buildTransport(config);
  await transport.verify();
}
