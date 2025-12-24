import { redisClient } from '../config/redis.js';

const MAX_MESSAGES = 10;
const TTL = 60 * 30; // 30 minutes

export const saveMessage = async (chatId, role, content) => {
  const key = `chat:${chatId}:messages`;

  await redisClient.rPush(
    key,
    JSON.stringify({ role, content })
  );

  // Keep only last N messages
  await redisClient.lTrim(key, -MAX_MESSAGES, -1);
  await redisClient.expire(key, TTL);
};

export const getChatMemory = async (chatId) => {
  const key = `chat:${chatId}:messages`;
  const messages = await redisClient.lRange(key, 0, -1);

  return messages.map(JSON.parse);
};
