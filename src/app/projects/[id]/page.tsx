import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import {
  Card,
  PageHeader,
  Badge,
  StatTile,
  AreaChart,
  LinkButton,
} from "@/components/ui";

function last30Buckets(rows: { createdAt: Date }[]) {
  const days = 30;
  const now = new Date();
  const buckets = new Array(days).fill(0);
  const labels: string[] = [];
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  for (const r of rows) {
    const diff = Math.floor(
      (r.createdAt.getTime() - start.getTime()) / 86_400_000
    );
    if (diff >= 0 && diff < days) buckets[diff]++;
  }
  for (let i = 0; i < days; i += 10) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  labels.push("now");
  return { buckets, labels };
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProject(id);

  const since = new Date(Date.now() - 30 * 86_400_000);
  const [contacts, events, workflows, activeWorkflows, sent, hasSmtp, hasKeys, emailRows, recentEmails] =
    await Promise.all([
      prisma.contact.count({ where: { projectId: id } }),
      prisma.event.count({ where: { projectId: id } }),
      prisma.workflow.count({ where: { projectId: id } }),
      prisma.workflow.count({ where: { projectId: id, status: "active" } }),
      prisma.emailLog.count({ where: { projectId: id, status: "sent" } }),
      prisma.smtpConfig.findUnique({ where: { projectId: id } }),
      prisma.apiKey.count({ where: { projectId: id, revokedAt: null } }),
      prisma.emailLog.findMany({
        where: { projectId: id, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.emailLog.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { contact: true },
      }),
    ]);

  const { buckets, labels } = last30Buckets(emailRows);
  const setupDone = hasSmtp && hasKeys > 0;

  return (
    <div>
      <PageHeader eyebrow="Operator Console" title="Dashboard" />

      {!setupDone && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <p className="op-label text-amber-700">Finish setup</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {!hasKeys && <li>• Create an API key to start receiving events.</li>}
            {!hasSmtp && <li>• Configure SMTP so workflows can send email.</li>}
          </ul>
          <div className="mt-3">
            <LinkButton href={`/projects/${id}/settings`} variant="secondary">
              Go to settings
            </LinkButton>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Contacts" value={contacts} accent />
        <StatTile label="Events" value={events} />
        <StatTile label="Emails sent" value={sent} />
        <StatTile label="Workflows" value={`${activeWorkflows}/${workflows}`} hint="active / total" />
        <StatTile label="API keys" value={hasKeys} />
      </div>

      <Card className="mt-6">
        <p className="op-label mb-4">Emails sent (last 30 days)</p>
        <AreaChart data={buckets} labels={labels} />
      </Card>

      <div className="mt-6">
        <p className="op-label mb-3">Recent emails</p>
        {recentEmails.length === 0 ? (
          <p className="text-sm text-slate-500">No emails sent yet.</p>
        ) : (
          <Card className="p-0">
            <table className="w-full text-sm">
              <tbody>
                {recentEmails.map((e) => (
                  <tr key={e.id} className="border-b border-[#eef0f3] last:border-0">
                    <td className="px-4 py-3 text-slate-900">{e.contact.email}</td>
                    <td className="px-4 py-3 text-slate-600">{e.subject}</td>
                    <td className="px-4 py-3">
                      <Badge
                        color={
                          e.status === "sent"
                            ? "green"
                            : e.status === "failed"
                            ? "red"
                            : "amber"
                        }
                      >
                        {e.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right op-label text-slate-400">
                      {e.createdAt.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
