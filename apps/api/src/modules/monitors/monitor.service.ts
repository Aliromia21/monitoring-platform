import mongoose from "mongoose";
import { MonitorModel } from "./monitor.model";

export async function createMonitor(userId: string, data: any) {
  const doc = await MonitorModel.create({
    ...data,
    userId: new mongoose.Types.ObjectId(userId),
    type: "HTTP"
  });

  return toMonitorDto(doc);
}

export async function listMonitors(userId: string, opts: { page: number; limit: number }) {
  const { page, limit } = opts;
  const filter = { userId: new mongoose.Types.ObjectId(userId) };

  const [items, total] = await Promise.all([
    MonitorModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    MonitorModel.countDocuments(filter)
  ]);

  return {
    items: items.map(toMonitorDtoLean),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function getMonitorById(userId: string, id: string) {
  if (!mongoose.isValidObjectId(id)) return null;

  const doc = await MonitorModel.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId)
  }).lean();

  return doc ? toMonitorDtoLean(doc) : null;
}

export async function updateMonitor(userId: string, id: string, patch: any) {
  if (!mongoose.isValidObjectId(id)) return null;

  const doc = await MonitorModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(userId) },
    { $set: patch },
    { new: true }
  );

  return doc ? toMonitorDto(doc) : null;
}

export async function deleteMonitor(userId: string, id: string) {
  if (!mongoose.isValidObjectId(id)) return false;

  const res = await MonitorModel.deleteOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId)
  });

  return res.deletedCount === 1;
}

function toMonitorDto(doc: any) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    type: doc.type,
    url: doc.url,
    method: doc.method,
    interval: doc.interval,
    timeout: doc.timeout,
    expectedStatus: doc.expectedStatus,
    enabled: doc.enabled,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

function toMonitorDtoLean(doc: any) {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    type: doc.type,
    url: doc.url,
    method: doc.method,
    interval: doc.interval,
    timeout: doc.timeout,
    expectedStatus: doc.expectedStatus,
    enabled: doc.enabled,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}
