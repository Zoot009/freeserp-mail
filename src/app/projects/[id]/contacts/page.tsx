import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { Card, PageHeader, Badge, EmptyState, Input } from "@/components/ui";

export default async function ContactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  await requireProject(id);

  const contacts = await prisma.contact.findMany({
    where: {
      projectId: id,
      ...(q ? { email: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { _count: { select: { events: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="People created via the API or by events. Showing up to 100."
      />

      <form className="mb-4 max-w-sm">
        <Input name="q" defaultValue={q ?? ""} placeholder="Search by email…" />
      </form>

      {contacts.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          description="Send an event or POST to /api/v1/contacts to create your first contact."
        />
      ) : (
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Events</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${id}/contacts/${c.id}`} className="font-medium text-indigo-600 hover:underline">
                      {c.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c._count.events}</td>
                  <td className="px-4 py-3">
                    {c.subscribed ? (
                      <Badge color="green">subscribed</Badge>
                    ) : (
                      <Badge color="slate">unsubscribed</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {c.updatedAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
