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

export async function listAlerts(
  userId: string,
  opts: { page: number; limit: number; monitorId?: string }
) {
  const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
  if (opts.monitorId && mongoose.isValidObjectId(opts.monitorId)) {
    filter.monitorId = new mongoose.Types.ObjectId(opts.monitorId);
  }

  const [items, total] = await Promise.all([
    AlertModel.find(filter)
      .sort({ timestamp: -1 })
      .skip((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .lean(),
    AlertModel.countDocuments(filter)
  ]);

  return {
    items: items.map((a: any) => ({
      id: a._id.toString(),
      monitorId: a.monitorId.toString(),
      userId: a.userId.toString(),
      type: a.type,
      message: a.message,
      timestamp: a.timestamp,
      readAt: a.readAt ?? null,          // ✅ جديد
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    })),
    page: opts.page,
    limit: opts.limit,
    total,
    pages: Math.ceil(total / opts.limit)
  };
}


export async function markAlertRead(userId: string, alertId: string) {
  if (!mongoose.isValidObjectId(alertId)) {
    return null;
  }

  const updated = await AlertModel.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(alertId),
      userId: new mongoose.Types.ObjectId(userId),
      readAt: null
    },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();

  // إذا كان التنبيه غير موجود أو لا يتبع المستخدم أو كان مقروءًا من قبل
  if (!updated) return null;

  return {
    id: updated._id.toString(),
    monitorId: updated.monitorId.toString(),
    userId: updated.userId.toString(),
    type: updated.type,
    message: updated.message,
    timestamp: updated.timestamp,
    readAt: updated.readAt ?? null,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  };
}
export async function markAllAlertsRead(userId: string) {
  const readAt = new Date();

  const result = await AlertModel.updateMany(
    {
      userId: new mongoose.Types.ObjectId(userId),
      readAt: null
    },
    { $set: { readAt } }
  );

  // في mongoose قد تكون modifiedCount أو nModified حسب الإصدار
  const updated =
    (result as any).modifiedCount ??
    (result as any).nModified ??
    0;

  return {
    updated,
    readAt: readAt.toISOString()
  };
}
export async function getUnreadAlertsCount(userId: string) {
  const unread = await AlertModel.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    readAt: null
  });

  return unread;
}
