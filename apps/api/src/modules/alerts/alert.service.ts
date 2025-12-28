import mongoose from "mongoose";
import { AlertModel } from "./alert.model";

export async function createAlert(params: {
  userId: string;
  monitorId: string;
  type: "DOWN" | "RECOVERY";
  message: string;
  timestamp: Date;
}) {
  return AlertModel.create({
    userId: new mongoose.Types.ObjectId(params.userId),
    monitorId: new mongoose.Types.ObjectId(params.monitorId),
    type: params.type,
    message: params.message,
    timestamp: params.timestamp
  });
}

export async function listAlerts(userId: string, opts: { page: number; limit: number; monitorId?: string }) {
  const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
  if (opts.monitorId && mongoose.isValidObjectId(opts.monitorId)) {
    filter.monitorId = new mongoose.Types.ObjectId(opts.monitorId);
  }

  const [items, total] = await Promise.all([
    AlertModel.find(filter).sort({ timestamp: -1 }).skip((opts.page - 1) * opts.limit).limit(opts.limit).lean(),
    AlertModel.countDocuments(filter)
  ]);

  return {
    items: items.map((a) => ({
      id: a._id.toString(),
      monitorId: a.monitorId.toString(),
      userId: a.userId.toString(),
      type: a.type,
      message: a.message,
      timestamp: a.timestamp,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    })),
    page: opts.page,
    limit: opts.limit,
    total,
    pages: Math.ceil(total / opts.limit)
  };
}
