import { Queue, type RedisOptions } from "bullmq";
import { env } from "./env";

export const WORKFLOW_QUEUE = "workflow";

export interface WorkflowJobData {
  runId: string;
  nodeId: string;
}

// Build BullMQ RedisOptions from REDIS_URL. We let BullMQ create/own the
// connection (using its bundled ioredis) rather than passing an external
// ioredis instance — that avoids version-mismatch type clashes and keeps a
// single connection story.
function redisOptions(): RedisOptions {
  const url = new URL(env.redisUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export const connection: RedisOptions = redisOptions();

const globalForQueue = globalThis as unknown as {
  workflowQueue?: Queue<WorkflowJobData>;
};

export function getWorkflowQueue(): Queue<WorkflowJobData> {
  const existing = globalForQueue.workflowQueue;
  if (existing) return existing;

  const queue = new Queue<WorkflowJobData>(WORKFLOW_QUEUE, {
    connection,
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    },
  });
  globalForQueue.workflowQueue = queue;
  return queue;
}

/** Enqueue the next node of a run, optionally after a delay (ms). */
export async function enqueueNode(
  data: WorkflowJobData,
  delayMs = 0
): Promise<void> {
  await getWorkflowQueue().add("process-node", data, {
    delay: delayMs > 0 ? delayMs : undefined,
    // Deduplicate immediate re-enqueues of the same run+node.
    // NOTE: BullMQ job IDs cannot contain ":" — use "-" as the separator.
    jobId: delayMs > 0 ? undefined : `${data.runId}-${data.nodeId}`,
  });
}
