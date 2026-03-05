import { env } from "./env";
export const redisConnection = {
  host: new URL(env.redisUrl).hostname,
  port: Number(new URL(env.redisUrl).port) || 6379,
  maxRetriesPerRequest: null,  
  retryStrategy: (times: number) => {
    if (times > 10) {
      console.error("Redis: too many retries, giving up");
      return null;
    }
    return Math.min(times * 200, 3000);
  },
};

console.log(`Redis config ready → ${env.redisUrl}`);