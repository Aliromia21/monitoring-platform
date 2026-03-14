import IORedis from "ioredis";
import { env } from "./env";

// Separate Redis client for caching — not shared with BullMQ
const url = new URL(env.redisUrl);

export const cacheClient = new IORedis({
  host:     url.hostname,
  port:     Number(url.port) || 6379,
  username: url.username || undefined,
  password: url.password || undefined,
});

cacheClient.on("error", (err) => {
  console.error("[Cache] Redis error:", err.message);
});

// TTL in seconds
export const CACHE_TTL = {
  monitors: 30,  // 30 seconds — monitors change frequently
  alerts:   60,  // 60 seconds — alerts change less frequently
};

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await cacheClient.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await cacheClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await cacheClient.keys(pattern);
  if (keys.length > 0) {
    await cacheClient.del(...keys);
  }
}