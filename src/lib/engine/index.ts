import { prisma } from "@/lib/db";
import { enqueueNode } from "@/lib/queue";
import { workflowDefinitionSchema, type WorkflowDefinition, type WorkflowNode } from "@/schemas";
import { getHandler, register } from "./registry";
import { triggerHandler } from "./handlers/trigger";
import { waitHandler } from "./handlers/wait";
import { conditionHandler } from "./handlers/condition";
import { sendEmailHandler } from "./handlers/send-email";
import type { NodeContext } from "./types";

// Register the MVP action handlers. Add new channels here (or via a plugin
// module that calls register()) with no changes to the loop below.
register(triggerHandler);
register(waitHandler);
register(conditionHandler);
register(sendEmailHandler);

export { register, getHandler, registeredTypes } from "./registry";
export type { ActionHandler, NodeContext, NodeResult } from "./types";

function findNode(def: WorkflowDefinition, nodeId: string): WorkflowNode | undefined {
  return def.nodes.find((n) => n.id === nodeId);
}

/**
 * Execute a single node of a run. Called by the worker for each queued job.
 * Idempotent-ish: a run that is no longer `running` is skipped, and the
 * enqueue jobId dedups immediate re-processing of the same run+node.
 */
export async function processNode(runId: string, nodeId: string): Promise<void> {
  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: { workflow: { include: { project: true } }, contact: true },
  });
  if (!run) return;
  if (run.status !== "running") return;

  const parsed = workflowDefinitionSchema.safeParse(run.workflow.definition);
  if (!parsed.success) {
    await failRun(runId, nodeId, "Invalid workflow definition");
    return;
  }
  const definition = parsed.data;
  const node = findNode(definition, nodeId);
  if (!node) {
    // Node was removed by an edit; end the run gracefully.
    await completeRun(runId, nodeId);
    return;
  }

  const handler = getHandler(node.type);
  if (!handler) {
    await failRun(runId, nodeId, `No handler for node type "${node.type}"`);
    return;
  }

  const ctx: NodeContext = {
    project: run.workflow.project,
    workflow: run.workflow,
    run,
    contact: run.contact,
    node,
    definition,
    eventContext: (run.context as Record<string, unknown>) ?? {},
  };

  try {
    const result = await handler.execute(ctx);

    await prisma.runStepLog.create({
      data: {
        runId,
        nodeId,
        type: node.type,
        status: "done",
        executedAt: new Date(),
        result: (result.detail ?? {}) as object,
      },
    });

    if (result.nextNodeId === null || result.nextNodeId === undefined) {
      await completeRun(runId, nodeId);
      return;
    }

    await prisma.workflowRun.update({
      where: { id: runId },
      data: { currentNodeId: result.nextNodeId },
    });

    if (result.delayMs && result.delayMs > 0) {
      await prisma.runStepLog.create({
        data: {
          runId,
          nodeId: result.nextNodeId,
          type: "scheduled",
          status: "scheduled",
          scheduledFor: new Date(Date.now() + result.delayMs),
        },
      });
    }
    await enqueueNode({ runId, nodeId: result.nextNodeId }, result.delayMs ?? 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failRun(runId, nodeId, message);
    throw err; // let BullMQ record the failure / retry
  }
}

async function completeRun(runId: string, nodeId: string): Promise<void> {
  await prisma.workflowRun.update({
    where: { id: runId },
    data: { status: "completed", currentNodeId: null },
  });
  await prisma.runStepLog.create({
    data: { runId, nodeId, type: "end", status: "done", executedAt: new Date() },
  });
}

async function failRun(runId: string, nodeId: string, error: string): Promise<void> {
  await prisma.workflowRun.update({
    where: { id: runId },
    data: { status: "failed" },
  });
  await prisma.runStepLog.create({
    data: {
      runId,
      nodeId,
      type: "error",
      status: "failed",
      executedAt: new Date(),
      result: { error },
    },
  });
}
