import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { PageHeader, Card, EmptyState, LinkButton, Button } from "@/components/ui";
import { deleteTemplateAction } from "./actions";

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProject(id);

  const templates = await prisma.emailTemplate.findMany({
    where: { projectId: id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Templates"
        description="Reusable emails with Handlebars variables."
        action={<LinkButton href={`/projects/${id}/templates/new`}>New template</LinkButton>}
      />

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create a template so your workflows have something to send."
          action={<LinkButton href={`/projects/${id}/templates/new`}>New template</LinkButton>}
        />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex items-center justify-between">
              <div>
                <Link href={`/projects/${id}/templates/${t.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                  {t.name}
                </Link>
                <p className="text-sm text-slate-500">{t.subject}</p>
              </div>
              <div className="flex items-center gap-2">
                <LinkButton href={`/projects/${id}/templates/${t.id}`} variant="secondary">
                  Edit
                </LinkButton>
                <form action={deleteTemplateAction}>
                  <input type="hidden" name="projectId" value={id} />
                  <input type="hidden" name="templateId" value={t.id} />
                  <Button variant="danger" type="submit">
                    Delete
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
