import type { Contact, Project, Workflow, WorkflowRun } from "@prisma/client";
import type { WorkflowDefinition, WorkflowNode } from "@/schemas";

// Everything a handler needs to execute one node of a run.
export interface NodeContext {
  project: Project;
  workflow: Workflow;
  run: WorkflowRun;
  contact: Contact;
  node: WorkflowNode;
  definition: WorkflowDefinition;
  // Snapshot of the event payload that started the run (properties + contact props).
  eventContext: Record<string, unknown>;
}

// Result of executing a node. The engine turns this into an enqueue / completion
// plus a RunStepLog row. A handler never touches the queue directly — that keeps
// each action decoupled from the transport and makes new actions trivial to add.
export interface NodeResult {
  // Node to run next, or null to complete the run.
  nextNodeId: string | null;
  // Delay before the next node runs (used by `wait`). 0 = immediate.
  delayMs?: number;
  // Arbitrary detail persisted to RunStepLog.result for the dashboard.
  detail?: Record<string, unknown>;
}

export interface ActionHandler {
  type: WorkflowNode["type"];
  execute(ctx: NodeContext): Promise<NodeResult>;
}
