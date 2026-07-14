import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { Card, PageHeader, Badge, Button } from "@/components/ui";
import { ApiKeyCreateForm } from "./api-keys-form";
import { SmtpForm } from "./smtp-form";
import { revokeApiKeyAction } from "./actions";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProject(id);

  const [keys, smtp] = await Promise.all([
    prisma.apiKey.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.smtpConfig.findUnique({ where: { projectId: id } }),
  ]);

  return (
    <div>
      <PageHeader title="Settings" description="API keys and email delivery." />

      <Card className="mb-8">
        <h2 className="mb-1 font-medium text-slate-900">API keys</h2>
        <p className="mb-4 text-sm text-slate-500">
          Use these with the <code className="text-xs">Authorization: Bearer</code> header to send events.
        </p>

        <ApiKeyCreateForm projectId={id} />

        <div className="mt-6 divide-y divide-slate-100">
          {keys.length === 0 && (
            <p className="text-sm text-slate-400">No keys yet.</p>
          )}
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {k.name}{" "}
                  {k.revokedAt && <Badge color="red">revoked</Badge>}
                </p>
                <p className="font-mono text-xs text-slate-400">
                  {k.prefix}…{" "}
                  {k.lastUsedAt
                    ? `last used ${k.lastUsedAt.toLocaleDateString()}`
                    : "never used"}
                </p>
              </div>
              {!k.revokedAt && (
                <form action={revokeApiKeyAction}>
                  <input type="hidden" name="projectId" value={id} />
                  <input type="hidden" name="keyId" value={k.id} />
                  <Button variant="danger" type="submit">
                    Revoke
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-1 font-medium text-slate-900">SMTP / email delivery</h2>
        <p className="mb-4 text-sm text-slate-500">
          Bring your own SMTP server or provider (SES, Postmark, Mailgun, or Mailhog for testing).
        </p>
        <SmtpForm
          projectId={id}
          initial={
            smtp
              ? {
                  host: smtp.host,
                  port: smtp.port,
                  secure: smtp.secure,
                  username: smtp.username,
                  fromEmail: smtp.fromEmail,
                  fromName: smtp.fromName,
                  hasPassword: Boolean(smtp.passwordEnc),
                }
              : null
          }
        />
      </Card>
    </div>
  );
}
