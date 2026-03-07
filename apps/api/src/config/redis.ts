import { env } from "./env";

const url = new URL(env.redisUrl);

export const redisConnection = {
  host:     url.hostname,
  port:     Number(url.port) || 6379,
  username: url.username || undefined,
  password: url.password || undefined,
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