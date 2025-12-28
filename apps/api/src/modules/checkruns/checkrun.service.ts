import mongoose from "mongoose";
import { CheckRunModel } from "./checkrun.model";

export async function listCheckRuns(params: {
  userId: string;
  monitorId: string;
  page: number;
  limit: number;
}) {
  const filter = {
    userId: new mongoose.Types.ObjectId(params.userId),
    monitorId: new mongoose.Types.ObjectId(params.monitorId)
  };

  const { page, limit } = params;

  const [items, total] = await Promise.all([
    CheckRunModel.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CheckRunModel.countDocuments(filter)
  ]);

  return {
    items: items.map((r) => ({
      id: r._id.toString(),
      monitorId: r.monitorId.toString(),
      userId: r.userId.toString(),
      timestamp: r.timestamp,
      status: r.status,
      statusCode: r.statusCode ?? null,
      responseTime: r.responseTime,
      error: r.error ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}
