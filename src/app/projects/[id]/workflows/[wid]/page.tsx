import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { PageHeader, Badge, Button, LinkButton } from "@/components/ui";
import { workflowDefinitionSchema } from "@/schemas";
import { WorkflowBuilder } from "./builder";
import { setWorkflowStatusAction, deleteWorkflowAction } from "../actions";

const statusColor = { draft: "slate", active: "green", paused: "amber" } as const;

export default async function WorkflowEditPage({
  params,
}: {
  params: Promise<{ id: string; wid: string }>;
}) {
  const { id, wid } = await params;
  await requireProject(id);

  const [workflow, templates] = await Promise.all([
    prisma.workflow.findFirst({ where: { id: wid, projectId: id } }),
    prisma.emailTemplate.findMany({
      where: { projectId: id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!workflow) notFound();

  const parsed = workflowDefinitionSchema.safeParse(workflow.definition);
  const definition = parsed.success ? parsed.data : null;

  const nextStatus = workflow.status === "active" ? "paused" : "active";

  return (
    <div>
      <PageHeader
        title={workflow.name}
        description="Build your automation with ordered steps."
        action={
          <div className="flex items-center gap-3">
            <Badge color={statusColor[workflow.status]}>{workflow.status}</Badge>
            <LinkButton href={`/projects/${id}/workflows/${wid}/runs`} variant="secondary">
              Runs
            </LinkButton>
            <form action={setWorkflowStatusAction}>
              <input type="hidden" name="projectId" value={id} />
              <input type="hidden" name="workflowId" value={wid} />
              <input type="hidden" name="status" value={nextStatus} />
              <Button type="submit">
                {workflow.status === "active" ? "Pause" : "Activate"}
              </Button>
            </form>
          </div>
        }
      />

      <WorkflowBuilder
        projectId={id}
        workflowId={wid}
        initialName={workflow.name}
        initialTrigger={workflow.triggerEvent}
        initialDefinition={definition}
        templates={templates}
      />

      <div className="mt-10 border-t border-slate-200 pt-6">
        <form action={deleteWorkflowAction}>
          <input type="hidden" name="projectId" value={id} />
          <input type="hidden" name="workflowId" value={wid} />
          <Button variant="danger" type="submit">Delete workflow</Button>
        </form>
      </div>
    </div>
  );
}
