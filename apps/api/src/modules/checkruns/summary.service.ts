import mongoose from "mongoose";
import { CheckRunModel } from "./checkrun.model";

export async function getMonitorSummary(params: {
  userId: string;
  monitorId: string;
  windowHours: number;
}) {
  const since = new Date(Date.now() - params.windowHours * 60 * 60 * 1000);

  const filter = {
    userId: new mongoose.Types.ObjectId(params.userId),
    monitorId: new mongoose.Types.ObjectId(params.monitorId),
    timestamp: { $gte: since }
  };

  const last = await CheckRunModel.findOne({
    userId: new mongoose.Types.ObjectId(params.userId),
    monitorId: new mongoose.Types.ObjectId(params.monitorId)
  })
    .sort({ timestamp: -1 })
    .lean();

  const agg = await CheckRunModel.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        up: { $sum: { $cond: [{ $eq: ["$status", "UP"] }, 1, 0] } },
        down: { $sum: { $cond: [{ $eq: ["$status", "DOWN"] }, 1, 0] } },
        avgResponseTime: { $avg: "$responseTime" },
        responseTimes: { $push: "$responseTime" }
      }
    }
  ]);

  const row = agg[0];

  const total = row?.total ?? 0;
  const up = row?.up ?? 0;
  const down = row?.down ?? 0;

  const uptimePct = total === 0 ? null : Math.round((up / total) * 10000) / 100;
  const avgResponseTimeMs =
    row?.avgResponseTime == null ? null : Math.round(row.avgResponseTime);

  const p95ResponseTimeMs = computeP95(row?.responseTimes ?? []);

  return {
    windowHours: params.windowHours,
    since,

    totalChecks: total,
    up,
    down,
    uptimePct,

    avgResponseTimeMs,
    p95ResponseTimeMs,

    lastStatus: last?.status ?? null,
    lastStatusCode: last?.statusCode ?? null,
    lastResponseTimeMs: last?.responseTime ?? null,
    lastCheckedAt: last?.timestamp ?? null
  };
}

function computeP95(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(0.95 * sorted.length) - 1;
  return Math.round(sorted[Math.min(idx, sorted.length - 1)]);
}
