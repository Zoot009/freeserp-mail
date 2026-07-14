import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { PageHeader, Card, EmptyState, Badge, Input, Button } from "@/components/ui";
import { createWorkflowAction } from "./actions";

const statusColor = { draft: "slate", active: "green", paused: "amber" } as const;

export default async function WorkflowsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProject(id);

  const workflows = await prisma.workflow.findMany({
    where: { projectId: id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });

  const create = createWorkflowAction.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Trigger → Wait → Condition → Send Email automations."
      />

      <Card className="mb-8">
        <form action={create} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <Input name="name" placeholder="Welcome series" required />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Trigger event</label>
            <Input name="triggerEvent" placeholder="signup" required />
          </div>
          <Button type="submit">Create workflow</Button>
        </form>
      </Card>

      {workflows.length === 0 ? (
        <EmptyState
          title="No workflows yet"
          description="Create a workflow above, then add Wait / Condition / Send Email steps."
        />
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <Card key={w.id} className="flex items-center justify-between">
              <div>
                <Link href={`/projects/${id}/workflows/${w.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                  {w.name}
                </Link>
                <p className="text-sm text-slate-500">
                  Trigger: <code className="text-xs">{w.triggerEvent}</code> · {w._count.runs} runs
                </p>
              </div>
              <Badge color={statusColor[w.status]}>{w.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
