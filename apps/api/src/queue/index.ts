

import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

//  Job Data Type 
export type MonitorCheckJobData = {
  monitorId: string;
  userId: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "HEAD";
  timeoutMs: number;
  expectedStatus: number;
  intervalSeconds: number;
  consecutiveFailures: number;
  lastStatus: "UP" | "DOWN" | null;
};

// Queue Definition 
export const monitorQueue = new Queue<MonitorCheckJobData>("monitor-checks", {
  connection: redisConnection,

  defaultJobOptions: {
    attempts: 3,

    // Wait 1s before retry 1, 2s before retry 2, 4s before retry 3
    backoff: {
      type: "exponential",
      delay: 1000,
    },


    removeOnComplete: { count: 1000 },
    removeOnFail: { age: 24 * 3600 },
  },
});

//Helper: Add a check Job to the Queue
//architectural change
export async function enqueueMonitorCheck(
  data: MonitorCheckJobData
): Promise<void> {
  await monitorQueue.add(
    "monitor-check",       
    data,
    {
      jobId: `monitor:${data.monitorId}:${Date.now()}`
    }
  );
}

//Get Queue stats 
export async function getQueueStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    monitorQueue.getWaitingCount(),
    monitorQueue.getActiveCount(),
    monitorQueue.getCompletedCount(),
    monitorQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}