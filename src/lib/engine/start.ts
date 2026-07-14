import { prisma } from "@/lib/db";
import { enqueueNode } from "@/lib/queue";
import { workflowDefinitionSchema } from "@/schemas";

interface StartArgs {
  projectId: string;
  contactId: string;
  event: string;
  eventProperties: Record<string, unknown>;
  contactProperties: Record<string, unknown>;
}

/**
 * Called after an event is ingested. Finds every active workflow whose trigger
 * matches the event and starts a run for the contact. Returns the number of
 * runs started. Never throws into the request path — failures are swallowed and
 * logged so ingestion stays fast and reliable.
 */
export async function startWorkflowsForEvent(args: StartArgs): Promise<number> {
  const workflows = await prisma.workflow.findMany({
    where: {
      projectId: args.projectId,
      status: "active",
      triggerEvent: args.event,
    },
  });

  let started = 0;
  for (const wf of workflows) {
    const parsed = workflowDefinitionSchema.safeParse(wf.definition);
    if (!parsed.success) continue;

    const trigger = parsed.data.nodes.find((n) => n.type === "trigger");
    if (!trigger) continue;

    try {
      const run = await prisma.workflowRun.create({
        data: {
          workflowId: wf.id,
          contactId: args.contactId,
          status: "running",
          currentNodeId: trigger.id,
          context: {
            event: args.event,
            ...args.eventProperties,
            ...args.contactProperties,
          },
        },
      });
      await enqueueNode({ runId: run.id, nodeId: trigger.id }, 0);
      started++;
    } catch (err) {
      console.error(`Failed to start workflow ${wf.id}:`, err);
    }
  }
  return started;
}
