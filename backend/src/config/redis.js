import { createClient } from 'redis';

const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  }
});

redisClient.on('connect', () => {
  console.log('Redis connected (Redis Cloud)');
});

redisClient.on('ready', () => {
  console.log('Redis ready');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err.message);
});

await redisClient.connect();

export default redisClient;
