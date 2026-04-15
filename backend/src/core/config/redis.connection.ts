import IORedis from 'ioredis';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

// maxRetriesPerRequest is required to be null for BullMQ
export const connection = new IORedis({
  host: redisHost,
  port: redisPort,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});
