import { Worker, Job } from "bullmq";
import mongoose from "mongoose";
import { redisConnection } from "../config/redis";
import { MonitorCheckJobData } from "../queue/index";
import { CheckRunModel } from "../modules/checkruns/checkrun.model";
import { AlertModel } from "../modules/alerts/alert.model";
import { MonitorModel } from "../modules/monitors/monitor.model";
import { runHttpCheck } from "../engine/httpCheck";
import { decideAlert } from "../engine/alertRules";

const ALERT_THRESHOLD = 3;

export async function processJob(job: Job<MonitorCheckJobData>): Promise<void> {
  const m = job.data;

  // 1. Run the HTTP check
  const result = await runHttpCheck({
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

  // 4. Create alert if needed
  if (decision) {
    await AlertModel.create({
      monitorId: new mongoose.Types.ObjectId(m.monitorId),
      userId:    new mongoose.Types.ObjectId(m.userId),
      type:      decision.type,
      message:   decision.message,
      timestamp,
    });
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

export function startWorker() {
  const worker = new Worker<MonitorCheckJobData>(
    "monitor-checks",
    processJob,
    {
      connection:   redisConnection,
      concurrency:  10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed — monitor ${job.data.monitorId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log("[Worker]  Monitor worker started");

  return worker;
}