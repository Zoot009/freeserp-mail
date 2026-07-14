import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProject } from "@/lib/auth-helpers";
import { PageHeader, Card, Badge, EmptyState, LinkButton } from "@/components/ui";

const runColor = {
  running: "amber",
  completed: "green",
  failed: "red",
  cancelled: "slate",
} as const;

export default async function RunsPage({
  params,
}: {
  params: Promise<{ id: string; wid: string }>;
}) {
  const { id, wid } = await params;
  await requireProject(id);

  const workflow = await prisma.workflow.findFirst({
    where: { id: wid, projectId: id },
  });
  if (!workflow) notFound();

  const runs = await prisma.workflowRun.findMany({
    where: { workflowId: wid },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      contact: true,
      steps: { orderBy: { createdAt: "asc" } },
    },
  });

  return (
    <div>
      <PageHeader
        title={`Runs — ${workflow.name}`}
        description="Every time this workflow fired, and what each step did."
        action={
          <LinkButton href={`/projects/${id}/workflows/${wid}`} variant="secondary">
            ← Back to builder
          </LinkButton>
        }
      />

      {runs.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="Activate the workflow and send its trigger event to see runs here."
        />
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <Card key={run.id}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{run.contact.email}</p>
                  <p className="text-xs text-slate-400">
                    started {run.createdAt.toLocaleString()}
                  </p>
                </div>
                <Badge color={runColor[run.status]}>{run.status}</Badge>
              </div>
              <ol className="space-y-1 text-sm">
                {run.steps.map((s) => (
                  <li key={s.id} className="flex items-center justify-between">
                    <span className="text-slate-700">
                      <span className="font-mono text-xs text-slate-400">{s.nodeId}</span>{" "}
                      {s.type}
                      {s.status === "scheduled" && s.scheduledFor && (
                        <span className="text-slate-400">
                          {" "}
                          → runs {s.scheduledFor.toLocaleString()}
                        </span>
                      )}
                    </span>
                    <Badge
                      color={
                        s.status === "done"
                          ? "green"
                          : s.status === "failed"
                          ? "red"
                          : s.status === "scheduled"
                          ? "amber"
                          : "slate"
                      }
                    >
                      {s.status}
                    </Badge>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
