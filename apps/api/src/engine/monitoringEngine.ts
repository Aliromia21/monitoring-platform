import mongoose from "mongoose";
import { MonitorModel } from "../modules/monitors/monitor.model";
import { CheckRunModel } from "../modules/checkruns/checkrun.model";
import { AlertModel } from "../modules/alerts/alert.model";
import { runHttpCheck } from "./httpCheck";
import { decideAlert } from "./alertRules";

type EngineOptions = {
  tickMs?: number;          // how often we scan for due monitors
  maxConcurrency?: number;  // how many checks in parallel
  alertThreshold?: number;  // consecutive failures threshold (default 3)
};

export function startMonitoringEngine(opts: EngineOptions = {}) {
  const tickMs = opts.tickMs ?? 2000;
  const maxConcurrency = opts.maxConcurrency ?? 10;
  const alertThreshold = opts.alertThreshold ?? 3;

  let running = false;

  // simple in-process concurrency control
  let inFlight = 0;
  const queue: Array<() => Promise<void>> = [];

  function enqueue(job: () => Promise<void>) {
    queue.push(job);
    drain();
  }

  function drain() {
    while (inFlight < maxConcurrency && queue.length > 0) {
      const job = queue.shift()!;
      inFlight++;
      job()
        .catch(() => undefined)
        .finally(() => {
          inFlight--;
          drain();
        });
    }
  }

  async function tick() {
    if (running) return;
    running = true;

    try {
      const now = new Date();

      // Find due monitors
      const due = await MonitorModel.find({
        enabled: true,
        $or: [{ nextCheckAt: null }, { nextCheckAt: { $lte: now } }]
      })
        .sort({ nextCheckAt: 1 })
        .limit(200) // safety
        .lean();

      for (const m of due) {
        enqueue(async () => {
          const result = await runHttpCheck({
            url: m.url,
            method: m.method,
            timeoutMs: m.timeout,
            expectedStatus: m.expectedStatus
          });

          const timestamp = new Date();
          const nextCheckAt = new Date(timestamp.getTime() + m.interval * 1000);

          // Store check run
          await CheckRunModel.create({
            monitorId: new mongoose.Types.ObjectId(m._id),
            userId: new mongoose.Types.ObjectId(m.userId),
            timestamp,
            status: result.status,
            statusCode: result.statusCode,
            responseTime: result.responseTime,
            error: result.error
          });

          // Decide alert (hardening)
          const prevFailures = m.consecutiveFailures ?? 0;
          const prevStatus = (m.lastStatus ?? null) as "UP" | "DOWN" | null;

          const decision = decideAlert({
            threshold: alertThreshold,
            prev: { prevFailures, prevStatus },
            current: { status: result.status }
          });

          if (decision) {
            await AlertModel.create({
              monitorId: new mongoose.Types.ObjectId(m._id),
              userId: new mongoose.Types.ObjectId(m.userId),
              type: decision.type,
              message: decision.message,
              timestamp
            });
          }

          // Update monitor summary fields (atomic-ish)
          const failures = result.status === "DOWN" ? prevFailures + 1 : 0;

          await MonitorModel.updateOne(
            { _id: m._id },
            {
              $set: {
                lastCheckedAt: timestamp,
                nextCheckAt,
                lastStatus: result.status,
                lastStatusCode: result.statusCode,
                lastResponseTime: result.responseTime,
                consecutiveFailures: failures
              }
            }
          );
        });
      }
    } finally {
      running = false;
    }
  }

  const interval = setInterval(() => void tick(), tickMs);
  void tick(); // run immediately once

  return {
    stop: () => clearInterval(interval)
  };
}
