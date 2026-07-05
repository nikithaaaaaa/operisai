import { Redis } from "ioredis";
import dotenv from 'dotenv';
dotenv.config();

const isRedisConfigured = !!process.env.REDIS_URL;
let redisClient = null;

if (isRedisConfigured) {
  redisClient = new Redis(process.env.REDIS_URL);
} else {
  console.warn('[Redis] No REDIS_URL provided. Using memory fallback cache.');
}

const memoryCache = new Map();
// For list operations in memory mode
const memoryLists = new Map();

export const redis = {
  async get(key) {
    if (redisClient) return redisClient.get(key);
    return memoryCache.get(key) || null;
  },
  async set(key, value, ...args) {
    if (redisClient) return redisClient.set(key, value, ...args);
    memoryCache.set(key, value);
    if (args.length >= 2 && args[0].toLowerCase() === 'ex') {
      setTimeout(() => memoryCache.delete(key), args[1] * 1000);
    }
    return 'OK';
  },
  async del(key) {
    if (redisClient) return redisClient.del(key);
    memoryCache.delete(key);
    memoryLists.delete(key);
    return 1;
  },
  async lpush(key, ...values) {
    if (redisClient) return redisClient.lpush(key, ...values);
    const list = memoryLists.get(key) || [];
    list.unshift(...values);
    memoryLists.set(key, list);
    return list.length;
  },
  async lrange(key, start, stop) {
    if (redisClient) return redisClient.lrange(key, start, stop);
    const list = memoryLists.get(key) || [];
    const end = stop === -1 ? list.length : stop + 1;
    return list.slice(start, end);
  },
  async ltrim(key, start, stop) {
    if (redisClient) return redisClient.ltrim(key, start, stop);
    const list = memoryLists.get(key) || [];
    const end = stop === -1 ? list.length : stop + 1;
    memoryLists.set(key, list.slice(start, end));
    return 'OK';
  },
  async expire(key, seconds) {
    if (redisClient) return redisClient.expire(key, seconds);
    setTimeout(() => {
      memoryCache.delete(key);
      memoryLists.delete(key);
    }, seconds * 1000);
    return 1;
  },
};
