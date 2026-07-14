import type { ActionHandler } from "../types";
import type { SendEmailNode } from "@/schemas";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { render, renderPlain } from "@/lib/templating";
import { getBranding, renderBrandedEmail } from "@/lib/branding";
import { env } from "@/lib/env";

// Renders the chosen template with contact + event context and sends it through
// the project's SMTP config. Respects the contact's subscription status and
// records an EmailLog row either way.
export const sendEmailHandler: ActionHandler = {
  type: "send_email",
  async execute(ctx) {
    const node = ctx.node as SendEmailNode;
    const next = node.next;

    // Unsubscribed contacts are skipped, but we still advance the workflow.
    if (!ctx.contact.subscribed) {
      return { nextNodeId: next, detail: { skipped: "unsubscribed" } };
    }

    const template = await prisma.emailTemplate.findFirst({
      where: { id: node.config.templateId, projectId: ctx.project.id },
    });
    if (!template) {
      throw new Error(`Template ${node.config.templateId} not found`);
    }

    const smtp = await prisma.smtpConfig.findUnique({
      where: { projectId: ctx.project.id },
    });
    if (!smtp) {
      throw new Error("No SMTP config for project");
    }

    const contactProps = (ctx.contact.properties as Record<string, unknown>) ?? {};
    const unsubscribeUrl = `${env.appUrl}/u/${ctx.contact.id}`;
    const view = {
      ...ctx.eventContext,
      ...contactProps,
      email: ctx.contact.email,
      unsubscribeUrl,
      // Base URL for hosted email images (served from the platform's /email/*.png).
      assetBase: env.assetBase,
    };

    const subject = renderPlain(template.subject, view);
    const branding = await getBranding(ctx.project.id);
    const innerHtml = render(template.html, view);
    // Apply the project's global branding shell (logo/color/footer) around the
    // template's content. Full-doc templates are left untouched.
    const html = renderBrandedEmail(innerHtml, branding, { unsubscribeUrl });
    const text = template.text ? renderPlain(template.text, view) : undefined;

    const log = await prisma.emailLog.create({
      data: {
        projectId: ctx.project.id,
        contactId: ctx.contact.id,
        templateId: template.id,
        workflowRunId: ctx.run.id,
        subject,
        status: "queued",
      },
    });

    try {
      const { messageId } = await sendMail(smtp, {
        to: ctx.contact.email,
        subject,
        html,
        text,
      });
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "sent", sentAt: new Date() },
      });
      return { nextNodeId: next, detail: { emailLogId: log.id, messageId } };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "failed", error: message },
      });
      throw new Error(`Email send failed: ${message}`);
    }
  },
};
