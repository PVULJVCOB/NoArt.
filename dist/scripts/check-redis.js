#!/usr/bin/env node
// Simple Redis connectivity check used in CI
const url = process.env.REDIS_URL;

if (!url) {
  console.error('REDIS_URL not set. Skipping Redis check.');
  process.exit(0);
}

(async () => {
  try {
    const IORedis = require('ioredis');
    const client = new IORedis(url, { connectTimeout: 5000 });
    await client.ping();
    console.log('Redis connection successful');
    await client.quit();
    process.exit(0);
  } catch (e) {
    console.error('Redis connectivity test failed:', e && e.message);
    process.exit(2);
  }
})();
