// Rate limiter helper
// - If REDIS_URL is set, use ioredis for cross-instance counting
// - Otherwise use an in-memory Map as best-effort for single-instance/dev

const WINDOW_SECONDS = parseInt(process.env.RATE_WINDOW || '60', 10); // window size in seconds
const MAX_COUNT = parseInt(process.env.RATE_MAX || '5', 10); // max requests per window

let redisClient = null;
if (process.env.REDIS_URL) {
  try {
    // ioredis is an optional dependency in this project
    const IORedis = require('ioredis');
    redisClient = new IORedis(process.env.REDIS_URL);
  } catch (e) {
    // silently ignore if ioredis not available; fallback to in-memory
    console.warn('ioredis not available, falling back to in-memory rate limiter');
    redisClient = null;
  }
}

const memoryMap = new Map();

async function checkAndIncrement(ip) {
  if (!ip) ip = 'unknown';

  if (redisClient) {
    try {
      const key = `rate:${ip}`;
      const count = await redisClient.incr(key);
      if (count === 1) {
        // set expiry for the key
        await redisClient.expire(key, WINDOW_SECONDS);
      }
      return { allowed: count <= MAX_COUNT, count, remaining: Math.max(0, MAX_COUNT - count) };
    } catch (e) {
      console.warn('Redis rate limiter error, falling back to memory:', e && e.message);
      // fall through to memory fallback
    }
  }

  // memory fallback
  const now = Date.now();
  const record = memoryMap.get(ip) || { count: 0, expiresAt: now + WINDOW_SECONDS * 1000 };
  if (now > record.expiresAt) {
    record.count = 0;
    record.expiresAt = now + WINDOW_SECONDS * 1000;
  }
  record.count += 1;
  memoryMap.set(ip, record);

  return { allowed: record.count <= MAX_COUNT, count: record.count, remaining: Math.max(0, MAX_COUNT - record.count) };
}

module.exports = { checkAndIncrement };
