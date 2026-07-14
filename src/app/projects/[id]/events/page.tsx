import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { Card, PageHeader, EmptyState, Badge } from "@/components/ui";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProject(id);

  const events = await prisma.event.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { contact: true },
  });

  return (
    <div>
      <PageHeader
        title="Events"
        description="The latest events received through your API. Showing up to 100."
      />

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="POST to /api/v1/events with an API key to see them appear here."
        />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-2 font-medium">Event</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Properties</th>
                <th className="px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const props = ev.properties as Record<string, unknown>;
                return (
                  <tr key={ev.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <Badge color="indigo">{ev.name}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/projects/${id}/contacts/${ev.contactId}`} className="text-indigo-600 hover:underline">
                        {ev.contact.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {Object.keys(props).length ? JSON.stringify(props) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {ev.createdAt.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
