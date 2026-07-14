import type { ActionHandler } from "../types";
import type { TriggerNode } from "@/schemas";

// The trigger node is just the entry point — advance to whatever follows it.
export const triggerHandler: ActionHandler = {
  type: "trigger",
  async execute(ctx) {
    const node = ctx.node as TriggerNode;
    return { nextNodeId: node.next, detail: { event: node.config.event } };
  },
};
