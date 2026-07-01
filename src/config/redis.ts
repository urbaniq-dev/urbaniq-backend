import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err: any) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis Connection Pending...');
});

redisClient.on('ready', () => {
  console.log('Redis Connected and Ready');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error: any) {
    console.error(`Redis connection failure: ${error.message}`);
    process.exit(1);
  }
};

export { redisClient, connectRedis };
