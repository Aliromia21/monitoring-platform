import mongoose from "mongoose";
import { MonitorModel } from "../monitors/monitor.model";
import { CheckRunModel } from "../checkruns/checkrun.model";
import { AlertModel } from "../alerts/alert.model";

export async function getDashboardSummary(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalMonitors,
    monitorsUp,
    monitorsDown,
    totalAlertsToday,
    uptimeAgg,
  ] = await Promise.all([

    // Total monitors
    MonitorModel.countDocuments({ userId: userObjectId }),

    // Monitors currently UP
    MonitorModel.countDocuments({ userId: userObjectId, lastStatus: "UP" }),

    // Monitors currently DOWN
    MonitorModel.countDocuments({ userId: userObjectId, lastStatus: "DOWN" }),

    // Alerts created in last 24h
    AlertModel.countDocuments({
      userId: userObjectId,
      timestamp: { $gte: since24h },
    }),

    // Average uptime across all monitors in last 24h
    CheckRunModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          timestamp: { $gte: since24h },
        },
      },
      {
        $group: {
          _id: "$monitorId",
          total: { $sum: 1 },
          up: { $sum: { $cond: [{ $eq: ["$status", "UP"] }, 1, 0] } },
        },
      },
      {
        $project: {
          uptimePct: {
            $multiply: [{ $divide: ["$up", "$total"] }, 100],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgUptime: { $avg: "$uptimePct" },
        },
      },
    ]),
  ]);

  const avgUptimeAllMonitors =
    uptimeAgg[0]?.avgUptime != null
      ? Math.round(uptimeAgg[0].avgUptime * 100) / 100
      : null;

  return {
    totalMonitors,
    monitorsUp,
    monitorsDown,
    totalAlertsToday,
    avgUptimeAllMonitors,
  };
}