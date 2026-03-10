import { Worker, Job, Queue } from "bullmq";
import mongoose from "mongoose";
import { redisConnection } from "../config/redis";
import { MonitorCheckJobData } from "../queue/index";
import { CheckRunModel } from "../modules/checkruns/checkrun.model";
import { AlertModel } from "../modules/alerts/alert.model";
import { MonitorModel } from "../modules/monitors/monitor.model";
import * as httpCheckModule from "../engine/httpCheck";
import { decideAlert } from "../engine/alertRules";
import { sendAlertNotification } from "../notifications/notificationService";
import { UserModel } from "../modules/users/user.model";

const ALERT_THRESHOLD = 3;

// ── Dead Letter Queue ────────────────────────────────────────────────
// Jobs that fail all 3 retry attempts land here for inspection/alerting
export const deadLetterQueue = new Queue<DeadLetterJobData>(
  "monitor-checks-failed",
  {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail:     { age: 7 * 24 * 3600 }, // keep for 7 days
    },
  }
);

export type DeadLetterJobData = {
  originalJob: MonitorCheckJobData;
  errorMessage: string;
  failedAt: string;
  attemptsMade: number;
};

// ── Main Job Processor ───────────────────────────────────────────────
export async function processJob(
  job: Job<MonitorCheckJobData>,
  httpCheck: typeof import("../engine/httpCheck").runHttpCheck = httpCheckModule.runHttpCheck
): Promise<void> {
  const m = job.data;

  const result = await httpCheck({
    url:            m.url,
    method:         m.method,
    timeoutMs:      m.timeoutMs,
    expectedStatus: m.expectedStatus,
  });

  const timestamp   = new Date();
  const nextCheckAt = new Date(timestamp.getTime() + m.intervalSeconds * 1000);

  // 2. Save CheckRun
  await CheckRunModel.create({
    monitorId:    new mongoose.Types.ObjectId(m.monitorId),
    userId:       new mongoose.Types.ObjectId(m.userId),
    timestamp,
    status:       result.status,
    statusCode:   result.statusCode,
    responseTime: result.responseTime,
    error:        result.error,
  });

  // 3. Decide alert
  const decision = decideAlert({
    threshold: ALERT_THRESHOLD,
    prev: {
      prevFailures: m.consecutiveFailures,
      prevStatus:   m.lastStatus,
    },
    current: { status: result.status },
  });

   // 4. Create alert + send notification if needed
  if (decision) {
    await AlertModel.create({
      monitorId: new mongoose.Types.ObjectId(m.monitorId),
      userId:    new mongoose.Types.ObjectId(m.userId),
      type:      decision.type,
      message:   decision.message,
      timestamp,
    });

    // Send email notification — fire and forget, don't block the job
    const [user, monitor] = await Promise.all([
      UserModel.findById(m.userId),
      MonitorModel.findById(m.monitorId),
    ]);

    if (user && monitor) {
      sendAlertNotification({
        to:          user.email,
        monitorName: monitor.name,
        url:         monitor.url,
        type:        decision.type,
        message:     decision.message,
        timestamp,
      }).catch((err) => {
        console.error(`[Notifications] Failed to send email:`, err.message);
      });
    }
  }
  // 5. Update monitor
  const failures = result.status === "DOWN" ? m.consecutiveFailures + 1 : 0;

  await MonitorModel.updateOne(
    { _id: m.monitorId },
    {
      $set: {
        lastCheckedAt:       timestamp,
        nextCheckAt,
        lastStatus:          result.status,
        lastStatusCode:      result.statusCode,
        lastResponseTime:    result.responseTime,
        consecutiveFailures: failures,
      },
    }
  );
}

// ── Dead Letter Queue Processor ──────────────────────────────────────
// Processes Jobs that exhausted all retries
async function processDeadLetter(job: Job<DeadLetterJobData>): Promise<void> {
  const { originalJob, errorMessage, failedAt, attemptsMade } = job.data;

  console.error(
    `[DLQ] Monitor ${originalJob.monitorId} failed ${attemptsMade} times — ${errorMessage}`
  );

  // SYSTEM_ERROR alert so the user knows something is wrong
  // monitoring infrastructure itself, not just the target URL
  await AlertModel.create({
    monitorId: new mongoose.Types.ObjectId(originalJob.monitorId),
    userId:    new mongoose.Types.ObjectId(originalJob.userId),
    type:      "SYSTEM_ERROR",
    message:   `Monitor check failed ${attemptsMade} times — ${errorMessage}`,
    timestamp: new Date(failedAt),
  });
}

// ── Start Worker ─────────────────────────────────────────────────────
export function startWorker() {
  // Main worker
 const worker = new Worker<MonitorCheckJobData>(
  "monitor-checks",
  (job) => processJob(job),
    {
      connection:  redisConnection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed — monitor ${job.data.monitorId}`);
  });

  // When a Job exhausts all retries → move to Dead Letter Queue
  worker.on("failed", async (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);

    if (!job) return;

    const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);

    if (isLastAttempt) {
      await deadLetterQueue.add("dead-letter", {
        originalJob:  job.data,
        errorMessage: err.message,
        failedAt:     new Date().toISOString(),
        attemptsMade: job.attemptsMade,
      });

      console.error(
        `[Worker] Job ${job.id} moved to Dead Letter Queue after ${job.attemptsMade} attempts`
      );
    }
  });

  // Dead Letter Queue worker
  const dlqWorker = new Worker<DeadLetterJobData>(
    "monitor-checks-failed",
    processDeadLetter,
    { connection: redisConnection }
  );

  dlqWorker.on("failed", (job, err) => {
    console.error(`[DLQ Worker] Failed to process dead letter job:`, err.message);
  });

  console.log("[Worker] Monitor worker started");
  console.log("[Worker] Dead Letter Queue worker started");

  return { worker, dlqWorker };
}