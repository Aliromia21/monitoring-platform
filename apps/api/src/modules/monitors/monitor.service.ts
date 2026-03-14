import mongoose from "mongoose";
import { MonitorModel } from "./monitor.model";
import { getCache, setCache, invalidateCache, CACHE_TTL } from "../../config/cache";

export async function createMonitor(userId: string, data: any) {
  const doc = await MonitorModel.create({
    ...data,
    userId: new mongoose.Types.ObjectId(userId),
    type: "HTTP"
  });

  // Invalidate list cache for this user
  await invalidateCache(`monitors:${userId}:*`);

  return toMonitorDto(doc);
}

export async function listMonitors(userId: string, opts: { page: number; limit: number }) {
  const { page, limit } = opts;
  const cacheKey = `monitors:${userId}:list:${page}:${limit}`;

  // Check cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[Cache] HIT — ${cacheKey}`);
    return cached;
  }

  console.log(`[Cache] MISS — ${cacheKey}`);

  const filter = { userId: new mongoose.Types.ObjectId(userId) };
  const [items, total] = await Promise.all([
    MonitorModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    MonitorModel.countDocuments(filter)
  ]);

  const result = {
    items: items.map(toMonitorDtoLean),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };

  await setCache(cacheKey, result, CACHE_TTL.monitors);

  return result;
}

export async function getMonitorById(userId: string, id: string) {
  if (!mongoose.isValidObjectId(id)) return null;

  const cacheKey = `monitors:${userId}:${id}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`[Cache] HIT — ${cacheKey}`);
    return cached;
  }

  console.log(`[Cache] MISS — ${cacheKey}`);

  const doc = await MonitorModel.findOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId)
  }).lean();

  const result = doc ? toMonitorDtoLean(doc) : null;

  if (result) {
    await setCache(cacheKey, result, CACHE_TTL.monitors);
  }

  return result;
}

export async function updateMonitor(userId: string, id: string, patch: any) {
  if (!mongoose.isValidObjectId(id)) return null;

  const doc = await MonitorModel.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id), userId: new mongoose.Types.ObjectId(userId) },
    { $set: patch },
    { new: true }
  );

  // Invalidate cache for this monitor and list
  await invalidateCache(`monitors:${userId}:*`);

  return doc ? toMonitorDto(doc) : null;
}

export async function deleteMonitor(userId: string, id: string) {
  if (!mongoose.isValidObjectId(id)) return false;

  const res = await MonitorModel.deleteOne({
    _id: new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(userId)
  });

  // Invalidate cache
  await invalidateCache(`monitors:${userId}:*`);

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