import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { Card, PageHeader, Badge } from "@/components/ui";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string; contactId: string }>;
}) {
  const { id, contactId } = await params;
  await requireProject(id);

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, projectId: id },
    include: {
      events: { orderBy: { createdAt: "desc" }, take: 50 },
      emailLogs: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!contact) notFound();

  const props = (contact.properties as Record<string, unknown>) ?? {};

  return (
    <div>
      <PageHeader
        title={contact.email}
        description={`Created ${contact.createdAt.toLocaleString()}`}
        action={
          contact.subscribed ? (
            <Badge color="green">subscribed</Badge>
          ) : (
            <Badge color="slate">unsubscribed</Badge>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium text-slate-900">Properties</h2>
          {Object.keys(props).length === 0 ? (
            <p className="text-sm text-slate-400">No properties.</p>
          ) : (
            <dl className="space-y-2 text-sm">
              {Object.entries(props).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-mono text-slate-800">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-medium text-slate-900">Emails</h2>
          {contact.emailLogs.length === 0 ? (
            <p className="text-sm text-slate-400">No emails.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {contact.emailLogs.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-slate-700">{e.subject}</span>
                  <Badge color={e.status === "sent" ? "green" : e.status === "failed" ? "red" : "amber"}>
                    {e.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 font-medium text-slate-900">Event history</h2>
        {contact.events.length === 0 ? (
          <p className="text-sm text-slate-400">No events.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {contact.events.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between py-2">
                <span className="font-medium text-slate-800">{ev.name}</span>
                <span className="text-slate-400">{ev.createdAt.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
