import { redisClient } from '../config/redis.js';
import crypto from 'crypto';

const TTL = 60 * 5; // 5 minutes

const makeKey = (workspaceId, question) =>
  `rag:${workspaceId}:${crypto
    .createHash('md5')
    .update(question.toLowerCase().trim())
    .digest('hex')}`;

export const getCachedRagAnswer = async (workspaceId, question) => {
  const key = makeKey(workspaceId, question);
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached) : null;
};

export const setCachedRagAnswer = async (
  workspaceId,
  question,
  data
) => {
  const key = makeKey(workspaceId, question);
  await redisClient.setEx(key, TTL, JSON.stringify(data));
};
