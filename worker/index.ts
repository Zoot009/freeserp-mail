import { Worker, type Job } from "bullmq";
import { WORKFLOW_QUEUE, connection, type WorkflowJobData } from "@/lib/queue";
import { processNode } from "@/lib/engine";

// The workflow worker. Runs as a separate process (see docker-compose `worker`
// service). Scale throughput by running more replicas — jobs are pulled from
// the shared Redis queue.

console.log("[worker] starting workflow worker…");

const worker = new Worker<WorkflowJobData>(
  WORKFLOW_QUEUE,
  async (job: Job<WorkflowJobData>) => {
    const { runId, nodeId } = job.data;
    console.log(`[worker] processing run=${runId} node=${nodeId}`);
    await processNode(runId, nodeId);
  },
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] done job=${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] failed job=${job?.id}: ${err.message}`);
});

async function shutdown() {
  console.log("[worker] shutting down…");
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
