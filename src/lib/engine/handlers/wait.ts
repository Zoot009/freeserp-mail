import type { ActionHandler } from "../types";
import type { WaitNode } from "@/schemas";

const UNIT_MS: Record<WaitNode["config"]["unit"], number> = {
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};

// Wait suspends the run until `delayMs` has elapsed. The engine enqueues the
// next node as a BullMQ delayed job, so long waits survive worker restarts.
export const waitHandler: ActionHandler = {
  type: "wait",
  async execute(ctx) {
    const node = ctx.node as WaitNode;
    const delayMs = node.config.duration * UNIT_MS[node.config.unit];
    return {
      nextNodeId: node.next,
      delayMs,
      detail: { duration: node.config.duration, unit: node.config.unit },
    };
  },
};
