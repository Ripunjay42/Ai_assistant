import { redisClient } from '../config/redis.js';

const MAX_REQ = 20;
const WINDOW = 60; // seconds

export const rateLimit = async (req, res, next) => {
  const userId = req.user.userId;
  const key = `rate:${userId}`;

  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, WINDOW);
  }

  if (count > MAX_REQ) {
    return res.status(429).json({
      message: 'Too many requests. Please slow down.'
    });
  }

  next();
};
